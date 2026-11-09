"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import Link from "@/components/site-link";
import { Bookmark, X } from "@/components/site-icons";
import { useAuth } from "./auth-provider";
import type { BookmarkKind, SavedEntry } from "@/lib/portal-types";

type Input = { kind: BookmarkKind; resourceId: string; title: string; href: string };
type BookmarkState = { entries: SavedEntry[]; loading: boolean; error: string | null; pending: Set<string>; toggle: (input: Input) => Promise<void>; refresh: () => void };
const Context = createContext<BookmarkState | null>(null);
export const savedKey = (kind: BookmarkKind, resourceId: string) => `${kind}:${kind === "guide" && resourceId === "bose" ? "lokawar" : resourceId}`;

export function BookmarksProvider({ children }: { children: React.ReactNode }) {
  const { session, loading: authLoading } = useAuth();
  const userId = session?.user.id ?? null; const token = session?.access_token;
  const [snapshot, setSnapshot] = useState<{ userId: string | null; entries: SavedEntry[]; error: string | null }>({ userId: null, entries: [], error: null });
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [revision, setRevision] = useState(0);
  const [notice, setNotice] = useState<{ text: string; login?: boolean } | null>(null);
  useEffect(() => {
    if (!token || !userId) return;
    const controller = new AbortController();
    void fetch("/api/bookmarks", { cache: "no-store", headers: { authorization: `Bearer ${token}` }, signal: controller.signal }).then(async response => {
      const data = await response.json() as { entries?: SavedEntry[]; error?: string };
      if (!response.ok || !Array.isArray(data.entries)) throw new Error(data.error || "보관함을 불러오지 못했습니다.");
      if (!controller.signal.aborted) setSnapshot({ userId, entries: data.entries, error: null });
    }).catch(error => { if (!controller.signal.aborted) setSnapshot({ userId, entries: [], error: error instanceof Error ? error.message : "보관함을 불러오지 못했습니다." }); });
    return () => controller.abort();
  }, [token, userId, revision]);
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(null), 5000); return () => clearTimeout(timer); }, [notice]);
  const entries = userId && snapshot.userId === userId ? snapshot.entries : [];
  const error = userId && snapshot.userId === userId ? snapshot.error : null;
  const loading = authLoading || Boolean(userId && snapshot.userId !== userId);
  async function toggle(input: Input) {
    if (!userId || !token) { setNotice({ text: "로그인하면 계정 보관함에 저장할 수 있어요.", login: true }); return; }
    const key = `${userId}:${savedKey(input.kind, input.resourceId)}`;
    if (pending.has(key) || loading || error) return;
    const previous = entries.find(entry => savedKey(entry.kind, entry.resourceId) === savedKey(input.kind, input.resourceId));
    const optimistic: SavedEntry = { ...input, createdAt: new Date().toISOString() };
    setPending(value => new Set(value).add(key));
    setSnapshot(value => value.userId === userId ? { ...value, entries: previous ? value.entries.filter(entry => savedKey(entry.kind, entry.resourceId) !== savedKey(input.kind, input.resourceId)) : [optimistic, ...value.entries] } : value);
    try {
      const response = await fetch("/api/bookmarks", { method: previous ? "DELETE" : "PUT", headers: { "content-type": "application/json", authorization: `Bearer ${token}` }, body: JSON.stringify({ kind: input.kind, resourceId: input.resourceId }) });
      const body = await response.json() as { entry?: SavedEntry; error?: string };
      if (!response.ok) throw new Error(body.error || "저장하지 못했습니다.");
      if (!previous && body.entry) setSnapshot(value => value.userId === userId ? { ...value, entries: value.entries.map(entry => savedKey(entry.kind, entry.resourceId) === savedKey(input.kind, input.resourceId) ? body.entry! : entry) } : value);
      setNotice({ text: previous ? "보관함에서 제거했어요." : "보관함에 저장했어요." });
    } catch (cause) {
      setSnapshot(value => value.userId === userId ? { ...value, entries: previous ? [previous, ...value.entries.filter(entry => savedKey(entry.kind, entry.resourceId) !== savedKey(input.kind, input.resourceId))] : value.entries.filter(entry => savedKey(entry.kind, entry.resourceId) !== savedKey(input.kind, input.resourceId)) } : value);
      setNotice({ text: cause instanceof Error ? cause.message : "저장하지 못했습니다." });
    } finally { setPending(value => { const next = new Set(value); next.delete(key); return next; }); }
  }
  const scopedPending = useMemo(() => new Set([...pending].filter(key => key.startsWith(`${userId}:`)).map(key => key.slice(`${userId}:`.length))), [pending, userId]);
  const returnTo = typeof window === "undefined" ? "/saved" : `${window.location.pathname}${window.location.search}${window.location.hash}`;
  return <Context.Provider value={{ entries, loading, error, pending: scopedPending, toggle, refresh: () => { setSnapshot({ userId: null, entries: [], error: null }); setRevision(value => value + 1); } }}>{children}
    {notice && <div className="portal-toast" role="status"><Bookmark size={18}/><span>{notice.text}</span><Link href={notice.login ? `/login?return_to=${encodeURIComponent(returnTo)}` : "/saved"}>{notice.login ? "로그인" : "보관함"}</Link><button type="button" aria-label="알림 닫기" onClick={() => setNotice(null)}><X size={16}/></button></div>}
  </Context.Provider>;
}

export function useBookmarks() { const value = useContext(Context); if (!value) throw new Error("BookmarksProvider is missing"); return value; }

export function BookmarkButton({ kind, resourceId, title, href, compact = false }: Input & { compact?: boolean }) {
  const { entries, loading, error, pending, toggle } = useBookmarks();
  const key = savedKey(kind, resourceId); const saved = entries.some(entry => savedKey(entry.kind, entry.resourceId) === key);
  const busy = pending.has(key);
  return <button className={`bookmark-button${compact ? " is-compact" : ""}`} type="button" aria-pressed={saved} aria-label={`${saved ? "저장 취소" : "저장"}: ${title}`} title={error ? "보관함에서 연결 상태를 확인해 주세요." : saved ? "보관함에서 제거" : "보관함에 저장"} disabled={loading || busy || Boolean(error)} aria-busy={busy} onClick={() => void toggle({ kind, resourceId, title, href })}><Bookmark size={19}/>{!compact && <span>{saved ? "저장됨" : "저장"}</span>}</button>;
}
