package online.libang.bridge;

import com.google.gson.*;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.io.TempDir;
import java.nio.file.*;
import java.nio.file.attribute.PosixFilePermissions;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;
import static org.junit.jupiter.api.Assertions.*;

class BridgeClientTest {
    @TempDir Path folder;
    static final String CODE = "LB-" + "a".repeat(40);
    static final String TOKEN = "lb_11111111-1111-4111-8111-111111111111." + "b".repeat(64);
    static final String PAIR = "{\"serverSlug\":\"dongwon\",\"token\":\"" + TOKEN + "\",\"heartbeatIntervalSeconds\":30}";
    static BridgeClient.Snapshot snapshot() { return new BridgeClient.Snapshot(3, 30, "26.3", "Leaf", List.of("26.3")); }
    static String pair(BridgeClient bridge, String code) throws Exception {
        CompletableFuture<String> future = new CompletableFuture<>(); bridge.pair(code, future::complete); return future.get(5, TimeUnit.SECONDS);
    }
    @Test void pairingPersistsPrivateCredentialAndSendsOnlyAggregateStats() throws Exception {
        List<String> logs = new CopyOnWriteArrayList<>(); List<JsonObject> heartbeats = new CopyOnWriteArrayList<>(); CountDownLatch sent = new CountDownLatch(1);
        BridgeClient bridge = new BridgeClient(folder, BridgeClientTest::snapshot, logs::add, (path, token, body) -> {
            if (path.endsWith("pair")) { assertNull(token); assertEquals(CODE, JsonParser.parseString(body).getAsJsonObject().get("code").getAsString()); return new BridgeClient.Reply(200, PAIR); }
            assertEquals(TOKEN, token); heartbeats.add(JsonParser.parseString(body).getAsJsonObject()); sent.countDown(); return new BridgeClient.Reply(200, "{}");
        });
        bridge.start(); try {
            assertTrue(pair(bridge, CODE).contains("연결했습니다")); assertTrue(sent.await(3, TimeUnit.SECONDS));
            Path file = folder.resolve("credentials.properties"); assertTrue(Files.readString(file).contains(TOKEN));
            if (Files.getFileStore(file).supportsFileAttributeView("posix")) assertEquals(PosixFilePermissions.fromString("rw-------"), Files.getPosixFilePermissions(file));
            JsonObject data = heartbeats.getFirst(); assertEquals(Set.of("state","playersOnline","playersMax","gameVersion","supportedVersions","software"), data.keySet());
            assertEquals(3, data.get("playersOnline").getAsInt()); assertEquals("26.3", data.get("gameVersion").getAsString());
            assertTrue(logs.stream().noneMatch(s -> s.contains(TOKEN) || s.contains(CODE)));
        } finally { bridge.close(); }
    }
    @Test void invalidCodeNeverLeavesServer() throws Exception {
        AtomicInteger requests = new AtomicInteger(); BridgeClient bridge = new BridgeClient(folder, BridgeClientTest::snapshot, s -> {}, (p,t,b) -> { requests.incrementAndGet(); return new BridgeClient.Reply(200, PAIR); });
        try { assertTrue(pair(bridge,"not-a-code").contains("형식")); assertEquals(0,requests.get()); } finally { bridge.close(); }
    }
    @Test void reusedOrExpiredCodeDoesNotCreateCredential() throws Exception {
        BridgeClient bridge = new BridgeClient(folder, BridgeClientTest::snapshot, s -> {}, (p,t,b) -> new BridgeClient.Reply(401,"{}")); bridge.start();
        try { assertTrue(pair(bridge,CODE).contains("만료")); assertFalse(Files.exists(folder.resolve("credentials.properties"))); } finally { bridge.close(); }
    }
    @Test void malformedServerResponseDoesNotPersistAnything() throws Exception {
        BridgeClient bridge = new BridgeClient(folder, BridgeClientTest::snapshot, s -> {}, (p,t,b) -> new BridgeClient.Reply(200,"{\"serverSlug\":\"other\",\"token\":\"malformed\"}")); bridge.start();
        try { assertTrue(pair(bridge,CODE).contains("완료하지 못했습니다")); assertFalse(Files.exists(folder.resolve("credentials.properties"))); } finally { bridge.close(); }
    }
    @Test void supportedVersionOverrideIsReadAndOfflineShutdownIsOffThread() throws Exception {
        Files.writeString(folder.resolve("config.properties"),"supported-versions=1.21.8,26.3\n"); CountDownLatch offline = new CountDownLatch(1); List<JsonObject> values = new CopyOnWriteArrayList<>(); long testThread = Thread.currentThread().threadId();
        BridgeClient bridge = new BridgeClient(folder, BridgeClientTest::snapshot, s -> {}, (p,t,b) -> {
            assertNotEquals(testThread,Thread.currentThread().threadId()); if(p.endsWith("pair"))return new BridgeClient.Reply(200,PAIR);
            JsonObject value=JsonParser.parseString(b).getAsJsonObject(); values.add(value); if(value.get("state").getAsString().equals("offline")) offline.countDown(); return new BridgeClient.Reply(200,"{}");
        }); bridge.start(); pair(bridge,CODE); bridge.close(); assertTrue(offline.await(3,TimeUnit.SECONDS));
        assertEquals("1.21.8",values.getFirst().getAsJsonArray("supportedVersions").get(0).getAsString()); assertEquals(0,values.getLast().get("playersOnline").getAsInt());
    }
    @Test void queuedCommandsNeverOverlapHttpRequests() throws Exception {
        AtomicInteger active=new AtomicInteger(),max=new AtomicInteger();
        BridgeClient bridge=new BridgeClient(folder,BridgeClientTest::snapshot,s->{},(p,t,b)->{int count=active.incrementAndGet();max.accumulateAndGet(count,Math::max);try{return new BridgeClient.Reply(200,p.endsWith("pair")?PAIR:"{}");}finally{active.decrementAndGet();}});bridge.start();
        try {List<CompletableFuture<String>> pending=new ArrayList<>();for(int i=0;i<8;i++){CompletableFuture<String> f=new CompletableFuture<>();pending.add(f);bridge.pair(CODE,f::complete);}for(var f:pending)assertTrue(f.get(5,TimeUnit.SECONDS).contains("연결했습니다"));assertEquals(1,max.get());}finally{bridge.close();}
    }
    @Test void credentialSurvivesRestartAndUnlinkDeletesLocalSecret() throws Exception {
        BridgeClient first=new BridgeClient(folder,BridgeClientTest::snapshot,s->{},(p,t,b)->new BridgeClient.Reply(200,p.endsWith("pair")?PAIR:"{}"));first.start();pair(first,CODE);first.close();
        BridgeClient next=new BridgeClient(folder,BridgeClientTest::snapshot,s->{},(p,t,b)->new BridgeClient.Reply(200,"{}"));next.start();CompletableFuture<String> reload=new CompletableFuture<>();next.reload(reload::complete);assertTrue(reload.get(3,TimeUnit.SECONDS).contains("dongwon"));CompletableFuture<String> unlink=new CompletableFuture<>();next.unlink(unlink::complete);assertTrue(unlink.get(3,TimeUnit.SECONDS).contains("해제"));assertFalse(Files.exists(folder.resolve("credentials.properties")));next.close();
    }
}
