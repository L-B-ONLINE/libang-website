import { z } from "zod";
import type { MinecraftCatalog, MinecraftNews, MinecraftVersion } from "./minecraft-catalog";

export const MANIFEST_URL = "https://piston-meta.mojang.com/mc/game/version_manifest_v2.json";
export const NEWS_URL = "https://launchercontent.mojang.com/v2/javaPatchNotes.json";
const MAX_JSON_BYTES = 2 * 1024 * 1024;
const validDate = z.string().refine(value => Number.isFinite(Date.parse(value)));
const manifestSchema = z.object({
  latest: z.object({ release: z.string(), snapshot: z.string() }),
  versions: z.array(z.object({
    id: z.string().min(1).max(100),
    type: z.enum(["release", "snapshot", "old_beta", "old_alpha"]),
    releaseTime: validDate,
    url: z.string().url(),
  })).max(10000),
});
const newsSchema = z.object({ entries: z.array(z.object({
  id: z.string(), version: z.string(), title: z.string(), shortText: z.string().default(""),
  date: validDate, type: z.enum(["release", "snapshot"]),
  image: z.object({ url: z.string(), title: z.string().optional() }).optional(),
})).max(10000) });

// Fixed public sources only. Bound both network time and decoded response size.
// Edge-cache successful official responses for 30 minutes; never cache errors.
export async function fetchMinecraftJson(url: string, fetcher: typeof fetch = fetch): Promise<unknown> {
  const options = {
    signal: AbortSignal.timeout(8000),
    redirect: "manual" as const,
    cf: { cacheEverything: true, cacheTtlByStatus: { "200-299": 1800, "400-599": 0 } },
  };
  const response = await fetcher(url, options);
  if (!response.ok || !response.body) throw new Error(`Minecraft source unavailable (${response.status})`);
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_JSON_BYTES) {
        await reader.cancel();
        throw new Error("Minecraft response too large");
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return JSON.parse(new TextDecoder().decode(bytes));
}

export function officialArticleUrl(version: string, type: string): string {
  if (!/^[a-zA-Z0-9._-]+$/.test(version)) return "https://www.minecraft.net/en-us/updates";
  let slug: string;
  if (type === "release") slug = `minecraft-java-edition-${version}`;
  else if (/^\d{2}w\d{2}[a-z]$/i.test(version)) slug = `minecraft-snapshot-${version}`;
  else slug = `minecraft-${version.replace(/-pre-?(\d+)$/i, "-pre-release-$1").replace(/-rc-?(\d+)$/i, "-release-candidate-$1")}`;
  return `https://www.minecraft.net/en-us/article/${slug.replace(/\./g, "-").toLowerCase()}`;
}

async function loadManifest(fetcher: typeof fetch) {
  const manifest = manifestSchema.parse(await fetchMinecraftJson(MANIFEST_URL, fetcher));
  if (!manifest.versions.some(v => v.id === manifest.latest.release) || !manifest.versions.some(v => v.id === manifest.latest.snapshot)) throw new Error("Invalid latest Minecraft version");
  manifest.versions.sort((a, b) => Date.parse(b.releaseTime) - Date.parse(a.releaseTime));
  return manifest;
}

// Confirmed game-drop names; unknown future drops keep their official version title.
export function minecraftUpdateName(id: string): string | null {
  const version = /^(\d+)\.(\d+)(?:\.(\d+))?(?:$|[-_])/.exec(id);
  if (!version) return null;
  const [, major, minor, patch = "0"] = version;
  if (major === "26") return ({ "1": "Tiny Takeover", "2": "Chaos Cubed", "3": "Wilderness Bound" } as Record<string, string>)[minor] ?? null;
  if (major !== "1") return null;
  if (minor === "20" && Number(patch) >= 5) return "Armored Paws";
  if (minor === "21") {
    const number = Number(patch);
    return number >= 11 ? "Mounts of Mayhem" : number >= 9 ? "The Copper Age" : number >= 6 ? "Chase the Skies" : number >= 5 ? "Spring to Life" : number >= 4 ? "The Garden Awakens" : number >= 2 ? "Bundles of Bravery" : "Tricky Trials";
  }
  return ({ "20": "Trails & Tales", "19": "The Wild Update", "18": "Caves & Cliffs: Part II", "17": "Caves & Cliffs: Part I", "16": "Nether Update", "15": "Buzzy Bees", "14": "Village & Pillage", "13": "Update Aquatic" } as Record<string, string>)[minor] ?? null;
}

export function officialMinecraftImage(path: string | undefined, alt: string) {
  if (!path) return null;
  try {
    const url = new URL(path, "https://launchercontent.mojang.com");
    if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash || url.host !== "launchercontent.mojang.com" || !/^\/(?:v2\/)?images\/[^/]+\.(?:jpe?g|png|webp)$/i.test(url.pathname)) return null;
    return { url: url.href, alt };
  } catch { return null; }
}

async function loadNews(fetcher: typeof fetch): Promise<MinecraftNews[]> {
  const { entries } = newsSchema.parse(await fetchMinecraftJson(NEWS_URL, fetcher));
  return entries.sort((a, b) => Date.parse(b.date) - Date.parse(a.date)).map(entry => ({
    id: entry.id, version: entry.version, title: entry.title,
    summary: entry.shortText.slice(0, 500), date: entry.date, type: entry.type,
    url: officialArticleUrl(entry.version, entry.type),
    updateName: minecraftUpdateName(entry.version),
    image: officialMinecraftImage(entry.image?.url, `${entry.title} 공식 이미지`),
  }));
}

export async function loadMinecraftCatalog(fetcher: typeof fetch = fetch): Promise<MinecraftCatalog> {
  const [manifest, news] = await Promise.allSettled([loadManifest(fetcher), loadNews(fetcher)]);
  const artwork = new Map(news.status === "fulfilled" ? news.value.map(entry => [entry.version, entry.image]) : []);
  for (const [source, result] of [["manifest", manifest], ["news", news]] as const) {
    if (result.status === "rejected") console.warn(JSON.stringify({ event: "minecraft_catalog_unavailable", source, reason: result.reason instanceof Error ? result.reason.message.slice(0, 160) : "Unknown error" }));
  }
  return {
    latest: manifest.status === "fulfilled" ? manifest.value.latest : null,
    versions: manifest.status === "fulfilled" ? manifest.value.versions.map(({ id, type, releaseTime }) => ({ id, type, releaseTime, updateName: minecraftUpdateName(id), image: artwork.get(id) ?? null })) : [],
    news: news.status === "fulfilled" ? news.value : [],
    versionsAvailable: manifest.status === "fulfilled", newsAvailable: news.status === "fulfilled",
  };
}

const metadataSchema = z.object({
  id: z.string(),
  javaVersion: z.object({ majorVersion: z.number().int().positive() }).optional(),
  minimumLauncherVersion: z.number().optional(),
  downloads: z.object({ server: z.object({ url: z.string().url(), sha1: z.string().regex(/^[a-f0-9]{40}$/), size: z.number().nonnegative() }).optional() }).optional(),
});

export function isOfficialMetadataUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && ["piston-meta.mojang.com", "launchermeta.mojang.com"].includes(url.host) && !url.username && !url.password && !url.search && !url.hash && /^\/v1\/packages\/[a-f0-9]{40}\/[^/]+\.json$/.test(url.pathname);
  } catch { return false; }
}

export async function loadMinecraftVersion(id: string, fetcher: typeof fetch = fetch) {
  const manifest = await loadManifest(fetcher);
  const version = manifest.versions.find(version => version.id === id);
  if (!version) return null;
  if (!isOfficialMetadataUrl(version.url)) throw new Error("Untrusted Minecraft metadata URL");
  const metadata = metadataSchema.parse(await fetchMinecraftJson(version.url, fetcher));
  if (metadata.id !== version.id) throw new Error("Minecraft version mismatch");
  const server = metadata.downloads?.server;
  let download: typeof server = undefined;
  if (server) {
    const url = new URL(server.url);
    if (url.protocol === "https:" && ["piston-data.mojang.com", "launcher.mojang.com"].includes(url.host) && !url.username && !url.password && !url.search && !url.hash && url.pathname === `/v1/objects/${server.sha1}/server.jar`) download = server;
  }
  let artwork: MinecraftNews | undefined;
  try { artwork = (await loadNews(fetcher)).find(entry => entry.version === id); } catch { /* Version metadata remains available without artwork. */ }
  return {
    version: { id: version.id, type: version.type, releaseTime: version.releaseTime, updateName: minecraftUpdateName(id), image: artwork?.image ?? null } satisfies MinecraftVersion,
    latestRelease: manifest.latest.release, latestSnapshot: manifest.latest.snapshot,
    javaVersion: metadata.javaVersion?.majorVersion ?? null,
    download: download ?? null, source: version.url,
  };
}
