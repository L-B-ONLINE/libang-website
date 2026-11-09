package online.libang.bridge;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import java.io.*;
import java.net.URI;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.nio.file.attribute.PosixFilePermissions;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.*;
import java.util.function.*;

/** Serialized, bounded outbound transport. This class never calls a game API. */
public final class BridgeClient implements AutoCloseable {
    public record Snapshot(int online, int capacity, String version, String software, List<String> supportedVersions) {}
    record Reply(int status, String body) {}
    @FunctionalInterface interface Transport { Reply post(String path, String token, String json) throws Exception; }
    private record Credential(String slug, String token) {}
    private final Path directory;
    private final Supplier<Snapshot> sample;
    private final Consumer<String> log;
    private final Transport transport;
    private final ScheduledExecutorService executor = Executors.newSingleThreadScheduledExecutor(r -> {
        Thread thread = new Thread(r, "libang-bridge-http"); thread.setDaemon(true); return thread;
    });
    private final Gson gson = new Gson();
    private volatile String status = "아직 사이트에 연결하지 않았습니다.";
    private volatile Credential credential;
    private volatile boolean closed;
    private boolean authorized = true;
    private List<String> configuredVersions = List.of();
    private long nextSend;
    private int failures;

    public BridgeClient(Path directory, Supplier<Snapshot> sample, Consumer<String> log) {
        this(directory, sample, log, productionTransport());
    }
    BridgeClient(Path directory, Supplier<Snapshot> sample, Consumer<String> log, Transport transport) {
        this.directory = directory; this.sample = sample; this.log = log; this.transport = transport;
    }
    public void start() {
        executor.execute(() -> { try { load(); } catch (Exception e) { status = "설정 파일을 읽지 못했습니다. 파일 권한을 확인하세요."; log.accept(status); } });
        executor.scheduleWithFixedDelay(this::tick, 5, 5, TimeUnit.SECONDS);
    }
    public String status() { return status; }
    public void pair(String code, Consumer<String> result) {
        if (!code.matches("LB-[a-f0-9]{40}")) { result.accept("연결 코드 형식을 확인하세요. 사이트 관리자에서 새 코드를 발급할 수 있습니다."); return; }
        if (closed) return;
        executor.execute(() -> {
            try {
                Reply reply = transport.post("/api/server-bridge/pair", null, gson.toJson(Map.of("code", code)));
                if (reply.status != 200) { result.accept(reply.status == 401 ? "연결 코드가 만료되었거나 이미 사용되었습니다. 새 코드를 발급하세요." : "사이트 연결에 실패했습니다. 잠시 후 다시 시도하세요. (HTTP " + reply.status + ")"); return; }
                JsonObject data = JsonParser.parseString(reply.body).getAsJsonObject();
                Credential next = new Credential(data.get("serverSlug").getAsString(), data.get("token").getAsString());
                validate(next);
                Properties properties = new Properties(); properties.setProperty("server", next.slug); properties.setProperty("token", next.token);
                storePrivate(directory.resolve("credentials.properties"), properties);
                credential = next; authorized = true; failures = 0; nextSend = 0;
                status = next.slug + " 연결 완료 · 첫 상태 전송 대기";
                result.accept("사이트와 연결했습니다: " + next.slug + ". 연결 키는 서버 내부에만 저장됩니다.");
                tick();
            } catch (Exception e) { result.accept("연결을 완료하지 못했습니다. 네트워크와 플러그인 폴더의 쓰기 권한을 확인하세요. 새 코드가 필요할 수 있습니다."); }
        });
    }
    public void reload(Consumer<String> result) {
        if (!closed) executor.execute(() -> { try { load(); nextSend = 0; result.accept("설정을 다시 불러왔습니다. " + status); } catch (Exception e) { result.accept("설정을 읽지 못했습니다. config.properties와 파일 권한을 확인하세요."); } });
    }
    public void unlink(Consumer<String> result) {
        if (!closed) executor.execute(() -> {
            try {
                try { if (credential != null && authorized) send(false); } catch (Exception ignored) {}
                Files.deleteIfExists(directory.resolve("credentials.properties"));
                credential = null; authorized = true; status = "로컬 연결을 해제했습니다.";
                result.accept("로컬 연결을 해제했습니다. 키를 폐기하려면 사이트 관리자에서도 연동을 해제하세요.");
            } catch (Exception e) { result.accept("해제를 완료하지 못했습니다. 사이트 관리자에서 연동을 해제해 주세요."); }
        });
    }
    private void load() throws IOException {
        Files.createDirectories(directory);
        Path config = directory.resolve("config.properties");
        if (!Files.exists(config)) Files.writeString(config, "# Java 25+ / Libang Bridge\n# Comma-separated displayed versions. Empty = platform version or Velocity range.\nsupported-versions=\n", StandardCharsets.UTF_8, StandardOpenOption.CREATE_NEW);
        Properties options = readProperties(config);
        List<String> versions = Arrays.stream(options.getProperty("supported-versions", "").split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList();
        if (versions.size() > 20 || versions.stream().anyMatch(s -> s.length() > 80)) throw new IOException("Invalid version configuration");
        Credential next = null; Path file = directory.resolve("credentials.properties");
        if (Files.exists(file)) { Properties stored = readProperties(file); next = new Credential(stored.getProperty("server", ""), stored.getProperty("token", "")); validate(next); protect(file); }
        configuredVersions = versions; credential = next; authorized = true;
        status = next == null ? "아직 사이트에 연결하지 않았습니다." : next.slug + " 연결됨 · 상태 전송 대기";
    }
    private void tick() {
        if (closed || credential == null || !authorized || System.nanoTime() < nextSend) return;
        try {
            Reply reply = send(true);
            if (reply.status == 200) { failures = 0; status = credential.slug + " 정상 연결 · 마지막 전송 " + java.time.Instant.now(); nextSend = System.nanoTime() + TimeUnit.SECONDS.toNanos(30); }
            else if (reply.status == 401 || reply.status == 403) { authorized = false; status = "연결 키가 만료 또는 폐기되었습니다. 사이트에서 새 코드를 발급해 다시 연결하세요."; log.accept(status); }
            else fail("HTTP " + reply.status);
        } catch (Exception e) { fail("네트워크 또는 응답 오류"); }
    }
    private void fail(String reason) {
        failures = Math.min(failures + 1, 20);
        long delay = Math.min(300, 30L << Math.min(failures - 1, 4));
        nextSend = System.nanoTime() + TimeUnit.SECONDS.toNanos(delay);
        status = "상태 전송 지연 (" + reason + ") · " + delay + "초 후 재시도";
        if (failures == 1 || failures % 10 == 0) log.accept(status);
    }
    private Reply send(boolean online) throws Exception {
        Snapshot data = sample.get();
        int count = online ? Math.max(0, Math.min(data.online, 100000)) : 0;
        int capacity = Math.max(count, Math.max(1, Math.min(data.capacity, 1000000)));
        List<String> versions = !configuredVersions.isEmpty() ? configuredVersions : data.supportedVersions;
        if (versions == null || versions.isEmpty()) versions = List.of(text(data.version));
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("state", online ? "online" : "offline"); payload.put("playersOnline", count); payload.put("playersMax", capacity);
        payload.put("gameVersion", text(data.version)); payload.put("software", text(data.software));
        payload.put("supportedVersions", versions.stream().limit(20).map(BridgeClient::text).toList());
        return transport.post("/api/server-bridge/heartbeat", credential.token, gson.toJson(payload));
    }
    private static String text(String value) { return value == null || value.isBlank() ? "unknown" : value.substring(0, Math.min(value.length(), 80)); }
    private static void validate(Credential credential) throws IOException {
        if (!Set.of("network", "dongwon", "bose", "reability").contains(credential.slug) || !credential.token.matches("lb_[a-f0-9-]{36}\\.[a-f0-9]{64}")) throw new IOException("Invalid credential");
    }
    private static Properties readProperties(Path file) throws IOException {
        if (Files.size(file) > 16384) throw new IOException("Settings too large");
        Properties properties = new Properties(); try (Reader reader = Files.newBufferedReader(file, StandardCharsets.UTF_8)) { properties.load(reader); } return properties;
    }
    private static void protect(Path path) throws IOException {
        if (Files.getFileStore(path).supportsFileAttributeView("posix")) Files.setPosixFilePermissions(path, PosixFilePermissions.fromString("rw-------"));
    }
    private static void storePrivate(Path file, Properties properties) throws IOException {
        Files.createDirectories(file.getParent());
        Path temporary = file.resolveSibling(".credentials-" + UUID.randomUUID());
        try {
            if (Files.getFileStore(file.getParent()).supportsFileAttributeView("posix")) Files.createFile(temporary, PosixFilePermissions.asFileAttribute(PosixFilePermissions.fromString("rw-------"))); else Files.createFile(temporary);
            try (Writer writer = Files.newBufferedWriter(temporary, StandardCharsets.UTF_8)) { properties.store(writer, "Private Libang server credential - do not share"); }
            try { Files.move(temporary, file, StandardCopyOption.ATOMIC_MOVE, StandardCopyOption.REPLACE_EXISTING); } catch (AtomicMoveNotSupportedException e) { Files.move(temporary, file, StandardCopyOption.REPLACE_EXISTING); }
            protect(file);
        } finally { Files.deleteIfExists(temporary); }
    }
    private static Transport productionTransport() {
        HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).followRedirects(HttpClient.Redirect.NEVER).build();
        return (path, token, json) -> {
            if (!Set.of("/api/server-bridge/pair", "/api/server-bridge/heartbeat").contains(path)) throw new IOException("Unknown operation");
            HttpRequest.Builder request = HttpRequest.newBuilder(URI.create("https://web.libang.online" + path)).timeout(Duration.ofSeconds(8))
                .header("Content-Type", "application/json").header("User-Agent", "LibangBridge/1.0.0").POST(HttpRequest.BodyPublishers.ofString(json, StandardCharsets.UTF_8));
            if (token != null) request.header("Authorization", "Bearer " + token);
            HttpResponse<InputStream> response = client.send(request.build(), HttpResponse.BodyHandlers.ofInputStream());
            try (InputStream stream = response.body()) {
                // HttpRequest timeout ends at headers with ofInputStream. Bound body reads separately.
                ScheduledExecutorService deadline = Executors.newSingleThreadScheduledExecutor(r -> { Thread t = new Thread(r, "libang-bridge-body-deadline"); t.setDaemon(true); return t; });
                ScheduledFuture<?> timeout = deadline.schedule(() -> { try { stream.close(); } catch (IOException ignored) {} }, 8, TimeUnit.SECONDS);
                try { byte[] bytes = stream.readNBytes(16385); if (bytes.length > 16384) throw new IOException("Response too large"); return new Reply(response.statusCode(), new String(bytes, StandardCharsets.UTF_8)); }
                finally { timeout.cancel(false); deadline.shutdownNow(); }
            }
        };
    }
    @Override public void close() {
        if (closed) return; closed = true;
        // A best-effort final signal runs off the server thread. Stale heartbeats expire on the website.
        executor.execute(() -> { try { if (credential != null && authorized) send(false); } catch (Exception ignored) {} });
        executor.shutdown();
    }
}
