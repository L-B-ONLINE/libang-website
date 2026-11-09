package online.libang.bridge;

import org.bukkit.Bukkit;
import org.bukkit.command.*;
import org.bukkit.plugin.java.JavaPlugin;
import org.bukkit.scheduler.BukkitTask;
import java.util.*;
import java.util.function.Consumer;

public final class LibangPaper extends JavaPlugin implements CommandExecutor, TabCompleter {
    private BridgeClient bridge;
    private BukkitTask sampler;
    private volatile BridgeClient.Snapshot latest;
    @Override public void onEnable() {
        sample();
        sampler = Bukkit.getScheduler().runTaskTimer(this, this::sample, 20, 20);
        bridge = new BridgeClient(getDataFolder().toPath(), () -> latest, message -> getLogger().warning(message));
        bridge.start();
        PluginCommand command = Objects.requireNonNull(getCommand("libangbridge")); command.setExecutor(this); command.setTabCompleter(this);
        getLogger().info("Libang Bridge enabled. Use /libangbridge status or pair with the website's one-time code.");
    }
    private void sample() {
        latest = new BridgeClient.Snapshot(Bukkit.getOnlinePlayers().size(), Bukkit.getMaxPlayers(), Bukkit.getMinecraftVersion(), Bukkit.getName(), List.of(Bukkit.getMinecraftVersion()));
    }
    @Override public void onDisable() { if (sampler != null) sampler.cancel(); if (bridge != null) bridge.close(); }
    @Override public boolean onCommand(CommandSender sender, Command command, String label, String[] args) {
        if (!sender.hasPermission("libangbridge.admin")) { sender.sendMessage("이 명령을 사용할 권한이 없습니다."); return true; }
        Consumer<String> reply = message -> { if (isEnabled()) Bukkit.getScheduler().runTask(this, () -> sender.sendMessage("[Libang] " + message)); };
        if (args.length == 2 && args[0].equalsIgnoreCase("pair")) { bridge.pair(args[1], reply); }
        else if (args.length == 1 && args[0].equalsIgnoreCase("status")) sender.sendMessage("[Libang] " + bridge.status());
        else if (args.length == 1 && args[0].equalsIgnoreCase("reload")) bridge.reload(reply);
        else if (args.length == 1 && args[0].equalsIgnoreCase("unlink")) bridge.unlink(reply);
        else sender.sendMessage("[Libang] /libangbridge pair <연결코드> | status | reload | unlink");
        return true;
    }
    @Override public List<String> onTabComplete(CommandSender sender, Command command, String alias, String[] args) {
        if (!sender.hasPermission("libangbridge.admin") || args.length != 1) return List.of();
        return List.of("pair", "status", "reload", "unlink").stream().filter(s -> s.startsWith(args[0].toLowerCase(Locale.ROOT))).toList();
    }
}
