export const serverSlugs = ["network", "dongwon", "bose", "reability"] as const;
export type BookmarkKind = "post" | "guide" | "version";
export type SavedEntry = { kind: BookmarkKind; resourceId: string; title: string; href: string; createdAt: string };
export type ServerUpdate = { id: number; serverSlug: string; category: "announcement" | "update" | "development" | "maintenance"; title: string; content: string; published: boolean; createdAt: string; updatedAt: string };
export type LiveServer = {
  slug: string; name: string; state: "online" | "offline" | "unknown" | "unlinked";
  playersOnline: number | null; playersMax: number | null; version: string | null;
  software: string | null; updatedAt: string | null; source: "bridge" | "public-query" | "none";
};
export const updateCategoryLabels = { announcement: "안내", update: "업데이트", development: "개발 소식", maintenance: "점검" };
export const serverNames: Record<string, string> = { network: "리뱅 네트워크", dongwon: "Dongwon", bose: "Bose", reability: "ReAbility" };

export function safeReturnPath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || /[\\\r\n]/.test(value)) return "/saved";
  try { const url = new URL(value, "https://web.libang.online"); return url.origin === "https://web.libang.online" && !url.pathname.startsWith("/login") ? `${url.pathname}${url.search}${url.hash}` : "/saved"; } catch { return "/saved"; }
}
