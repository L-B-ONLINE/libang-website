export type SearchKind = "server" | "guide" | "post" | "version" | "update";
export type SearchEntry = { id: string; kind: SearchKind; title: string; description: string; href: string; keywords?: string };
export const searchLabels: Record<SearchKind, string> = { server: "서버", guide: "가이드", post: "포럼", version: "마인크래프트 버전", update: "리뱅 소식" };

export function searchEntries(entries: SearchEntry[], query: string, limit = 24): SearchEntry[] {
  const tokens = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean).slice(0, 8);
  if (!tokens.length) return entries.filter(entry => entry.kind === "server" || entry.kind === "guide").slice(0, 10);
  return entries.map((entry, index) => {
    const title = entry.title.toLocaleLowerCase();
    const text = `${title} ${entry.description} ${entry.keywords ?? ""}`.toLocaleLowerCase();
    if (!tokens.every(token => text.includes(token))) return null;
    const score = tokens.reduce((sum, token) => sum + (title === token ? 100 : title.startsWith(token) ? 50 : title.includes(token) ? 25 : 5), 0);
    return { entry, score, index };
  }).filter((entry): entry is { entry: SearchEntry; score: number; index: number } => entry !== null).sort((a, b) => b.score - a.score || a.index - b.index).slice(0, limit).map(item => item.entry);
}
