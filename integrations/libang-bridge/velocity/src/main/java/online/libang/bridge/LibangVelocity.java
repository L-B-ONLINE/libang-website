package online.libang.bridge;

import com.google.inject.Inject;
import com.velocitypowered.api.command.*;
import com.velocitypowered.api.event.Subscribe;
import com.velocitypowered.api.event.proxy.*;
import com.velocitypowered.api.network.ProtocolVersion;
import com.velocitypowered.api.plugin.annotation.DataDirectory;
import com.velocitypowered.api.proxy.ProxyServer;
import com.velocitypowered.api.proxy.ConsoleCommandSource;
import net.kyori.adventure.text.Component;
import org.slf4j.Logger;
import java.nio.file.Path;
import java.util.*;

public final class LibangVelocity implements SimpleCommand {
    private final ProxyServer server;
    private final Logger logger;
    private final Path directory;
    private BridgeClient bridge;
    @Inject public LibangVelocity(ProxyServer server, Logger logger, @DataDirectory Path directory) { this.server = server; this.logger = logger; this.directory = directory; }
    @Subscribe public void initialize(ProxyInitializeEvent event) {
        bridge = new BridgeClient(directory, () -> {
            String range = ProtocolVersion.MINIMUM_VERSION.getVersionIntroducedIn() + "–" + ProtocolVersion.MAXIMUM_VERSION.getMostRecentSupportedVersion();
            return new BridgeClient.Snapshot(server.getPlayerCount(), server.getConfiguration().getShowMaxPlayers(), ProtocolVersion.MAXIMUM_VERSION.getMostRecentSupportedVersion(), "Velocity " + server.getVersion().getVersion(), List.of(range));
        }, logger::warn);
        bridge.start();
        server.getCommandManager().register(server.getCommandManager().metaBuilder("libangbridge").plugin(this).build(), this);
        logger.info("Libang Bridge enabled. Use /libangbridge status or pair with the website's one-time code.");
    }
    @Subscribe public void shutdown(ProxyShutdownEvent event) { if (bridge != null) bridge.close(); }
    @Override public boolean hasPermission(Invocation invocation) { return invocation.source() instanceof ConsoleCommandSource || invocation.source().hasPermission("libangbridge.admin"); }
    @Override public void execute(Invocation invocation) {
        if (!hasPermission(invocation)) return;
        String[] args = invocation.arguments();
        java.util.function.Consumer<String> reply = message -> invocation.source().sendMessage(Component.text("[Libang] " + message));
        if (args.length == 2 && args[0].equalsIgnoreCase("pair")) bridge.pair(args[1], reply);
        else if (args.length == 1 && args[0].equalsIgnoreCase("status")) reply.accept(bridge.status());
        else if (args.length == 1 && args[0].equalsIgnoreCase("reload")) bridge.reload(reply);
        else if (args.length == 1 && args[0].equalsIgnoreCase("unlink")) bridge.unlink(reply);
        else reply.accept("/libangbridge pair <연결코드> | status | reload | unlink");
    }
    @Override public List<String> suggest(Invocation invocation) {
        if (!hasPermission(invocation) || invocation.arguments().length != 1) return List.of();
        String prefix = invocation.arguments()[0].toLowerCase(Locale.ROOT);
        return List.of("pair", "status", "reload", "unlink").stream().filter(s -> s.startsWith(prefix)).toList();
    }
}
