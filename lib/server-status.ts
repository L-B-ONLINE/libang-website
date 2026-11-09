import { getHeartbeatRows } from "../db/portal";
import { bridgeState } from "./portal-model";
import { serverNames, serverSlugs, type LiveServer } from "./portal-types";

export async function publicNetworkStatus(fetcher: typeof fetch = fetch): Promise<LiveServer> {
  const empty: LiveServer = { slug: "network", name: serverNames.network, state: "unknown", playersOnline: null, playersMax: null, version: null, software: null, updatedAt: null, source: "none" };
  try {
    const options = { signal: AbortSignal.timeout(5000), redirect: "manual" as const, headers: { "User-Agent": "LibangWebsite/1.0 (+https://web.libang.online)" }, cf: { cacheEverything: true, cacheTtlByStatus: { "200-299": 60, "400-599": 0 } } };
    const response = await fetcher("https://api.mcsrvstat.us/3/libang.online", options);
    if (!response.ok || !response.body) return empty;
    const reader = response.body.getReader(); const parts: Uint8Array[] = []; let size = 0;
    try {
      while (true) { const { done, value } = await reader.read(); if (done) break; size += value.byteLength; if (size > 262144) { await reader.cancel(); return empty; } parts.push(value); }
    } finally { reader.releaseLock(); }
    const bytes = new Uint8Array(size); let offset = 0; for (const part of parts) { bytes.set(part, offset); offset += part.byteLength; }
    const data = JSON.parse(new TextDecoder().decode(bytes)) as { online?: unknown; players?: { online?: unknown; max?: unknown }; version?: unknown; software?: unknown; debug?: { cachetime?: unknown } };
    if (typeof data.online !== "boolean") return empty;
    const number = (value: unknown) => typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 1000000 ? value : null;
    const text = (value: unknown) => typeof value === "string" ? value.replace(/\u00a7[0-9a-fk-or]/gi, "").slice(0, 80) : null;
    const timestamp = typeof data.debug?.cachetime === "number" && data.debug.cachetime > 1000000000 && data.debug.cachetime < Date.now() / 1000 + 60 ? data.debug.cachetime * 1000 : Date.now();
    return { ...empty, source: "public-query", state: data.online ? "online" : "offline", playersOnline: data.online ? number(data.players?.online) : 0, playersMax: number(data.players?.max), version: text(data.version), software: text(data.software), updatedAt: new Date(timestamp).toISOString() };
  } catch { return empty; }
}

export async function loadServerStatus() {
  let rows: Awaited<ReturnType<typeof getHeartbeatRows>> = [];
  try { rows = await getHeartbeatRows(); } catch { /* Public network checking remains available during setup. */ }
  const mapped = new Map(rows.map(row => [row.serverSlug, row]));
  const network = mapped.get("network");
  const fallback = !network || bridgeState(network.state, network.updatedAt.getTime()) === "unknown" ? await publicNetworkStatus() : null;
  const result = serverSlugs.map(slug => {
    const row = mapped.get(slug);
    if (slug === "network" && fallback) return fallback;
    if (!row) return { slug, name: serverNames[slug], state: "unlinked", playersOnline: null, playersMax: null, version: null, software: null, updatedAt: null, source: "none" } satisfies LiveServer;
    let versions: string[] = [];
    try { const value: unknown = JSON.parse(row.supportedVersions); if (Array.isArray(value)) versions = value.filter(item => typeof item === "string").slice(0, 20); } catch { /* Show the reported game version instead. */ }
    return { slug, name: serverNames[slug], state: bridgeState(row.state, row.updatedAt.getTime()), playersOnline: row.playersOnline, playersMax: row.playersMax, version: versions.join(" · ") || row.gameVersion, software: row.software, updatedAt: row.updatedAt.toISOString(), source: "bridge" } satisfies LiveServer;
  });
  return { servers: result, checkedAt: new Date().toISOString() };
}
