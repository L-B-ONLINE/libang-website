export type SearchKind = "server" | "guide" | "post" | "version" | "update";
export type SearchEntry = { id: string; kind: SearchKind; title: string; description: string; href: string; keywords?: string };
export const searchLabels: Record<SearchKind, string> = { server: "서버", guide: "가이드", post: "포럼", version: "마인크래프트 버전", update: "리뱅 소식" };
export const searchScopes: { kind: SearchKind; label: string }[] = [{ kind: "post", label: "포럼" }, { kind: "guide", label: "가이드" }, { kind: "server", label: "서버" }, { kind: "version", label: "마인크래프트" }, { kind: "update", label: "서버 소식" }];
export function searchTokens(query: string) { return query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean).slice(0, 8); }
export function searchExcerpt(content: string, query: string, length = 180) {
  const text = content.replace(/\s+/g, " ");
  const matches = searchTokens(query).map(token => text.toLocaleLowerCase().indexOf(token)).filter(index => index >= 0);
  const start = matches.length ? Math.max(0, Math.min(...matches) - 45) : 0;
  return `${start ? "…" : ""}${text.slice(start, start + length)}${text.length > start + length ? "…" : ""}`;
}
export function searchEntries(entries: SearchEntry[], query: string, limit = 24, scope: SearchKind | null = null): SearchEntry[] {
  const scoped = scope ? entries.filter(entry => entry.kind === scope) : entries;
  const tokens = searchTokens(query);
  if (!tokens.length) return (scope ? scoped : scoped.filter(entry => entry.kind === "server" || entry.kind === "guide")).slice(0, scope ? limit : 10);
  return scoped.map((entry, index) => {
    const title = entry.title.toLocaleLowerCase();
    const text = `${title} ${entry.description} ${entry.keywords ?? ""}`.toLocaleLowerCase();
    if (!tokens.every(token => text.includes(token))) return null;
    const score = tokens.reduce((sum, token) => sum + (title === token ? 100 : title.startsWith(token) ? 50 : title.includes(token) ? 25 : 5), 0);
    return { entry, score, index };
  }).filter((entry): entry is { entry: SearchEntry; score: number; index: number } => entry !== null).sort((a, b) => b.score - a.score || a.index - b.index).slice(0, limit).map(item => item.entry);
}
