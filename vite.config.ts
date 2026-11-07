import vinext from "vinext";
import { defineConfig } from "vite";

import { readExecutionProfile } from "./scripts/execution-profile.mjs";


// macOS Seatbelt blocks FSEvents, so Codex previews need polling for HMR.
const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === "seatbelt";
const managedLinux = readExecutionProfile() === "managed-linux";

const preview = process.env.CLOUDFLARE_ENV === "preview";
const localBindingConfig = {
  name: preview ? "libang-website-preview" : "libang-website",
  main: "vinext/server/fetch-handler",
  compatibility_date: "2026-11-07",
  compatibility_flags: ["nodejs_compat"],
  workers_dev: true,
  keep_vars: true,
  observability: { enabled: true, traces: { enabled: true, head_sampling_rate: 0.1 } },
  d1_databases: [{
    binding: "DB",
    database_name: preview ? "libang-preview" : "libang-production",
    database_id: preview ? "bbc69e3f-3591-4a22-972e-8f35ccf6c718" : "5fd72f97-92e1-40dd-add1-2102d35b61c9",
    migrations_dir: "drizzle",
  }],
};

export default defineConfig(async () => {
  // Use Miniflare's local Request.cf placeholder unless fetching is requested.
  process.env.CLOUDFLARE_CF_FETCH_ENABLED ??= "false";
  process.env.WRANGLER_SEND_METRICS ??= "false";

  // Keep Wrangler and Miniflare state project-local. These are non-secret tool
  // settings; application environment belongs in ignored `.env*` files.
  process.env.WRANGLER_WRITE_LOGS ??= "false";
  process.env.WRANGLER_LOG_PATH ??= ".wrangler/logs";
  process.env.WRANGLER_REGISTRY_PATH ??= ".wrangler/dev-registry";
  process.env.MINIFLARE_REGISTRY_PATH ??= ".wrangler/registry";

  // Wrangler snapshots its log path while the Cloudflare plugin is imported.
  const { cloudflare } = await import("@cloudflare/vite-plugin");

  return {
    server: {
      ...(managedLinux ? { host: "0.0.0.0", allowedHosts: ["terminal.local"] } : {}),
      ...(isCodexSeatbeltSandbox ? { watch: { useFsEvents: false, usePolling: true } } : {}),
    },
    plugins: [
      vinext(),
      cloudflare({
        viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
        inspectorPort: false,
        config: localBindingConfig,
      }),
    ],
  };
});
