"use client";

import { createContext, useCallback, useContext, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "radix-ui";
import { Command } from "cmdk";
import { ArrowRight, BookOpen, MessageSquare, Search, X } from "@/components/site-icons";
import { searchEntries, searchLabels, searchScopes, type SearchEntry, type SearchKind } from "@/lib/search-model";
const Context = createContext<{ open: boolean; show: () => void } | null>(null);

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter(); const [open, setOpen] = useState(false); const [query, setQuery] = useState("");
  const [scope, setScope] = useState<SearchKind | null>(null);
  const [index, setIndex] = useState<{ entries: SearchEntry[]; partial: boolean } | null>(null); const [error, setError] = useState(""); const [revision, setRevision] = useState(0);
  const [forum, setForum] = useState<{ query: string | null; entries: SearchEntry[]; error?: string }>({ query: null, entries: [] });
  const input = useRef<HTMLInputElement>(null); const navigating = useRef(false); const deferred = useDeferredValue(query);
  const show = useCallback(() => { window.dispatchEvent(new Event("libang:close-menus")); navigating.current = false; setOpen(true); }, []);
  const close = useCallback(() => { setOpen(false); setQuery(""); setScope(null); }, []);
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); if (open) close(); else show(); } };
    window.addEventListener("keydown", keydown); return () => window.removeEventListener("keydown", keydown);
  }, [open, close, show]);
  useEffect(() => {
    if (!open || index || scope === "post") return;
    const controller = new AbortController();
    void fetch("/api/search", { signal: controller.signal }).then(async response => {
      const body = await response.json() as { entries: SearchEntry[]; partial?: boolean };
      if (!response.ok || !Array.isArray(body.entries)) throw new Error("검색 정보를 불러오지 못했습니다.");
      if (!controller.signal.aborted) { setIndex({ entries: body.entries, partial: Boolean(body.partial) }); setError(""); }
    }).catch(cause => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "검색 정보를 불러오지 못했습니다."); });
    return () => controller.abort();
  }, [open, index, revision, scope]);
  useEffect(() => {
    if (!open || scope !== "post") return;
    const controller = new AbortController(); const normalized = query.trim();
    const timer = setTimeout(() => {
      void fetch(`/api/search?scope=post&q=${encodeURIComponent(normalized)}`, { signal: controller.signal }).then(async response => {
        const data = await response.json() as { entries?: SearchEntry[]; error?: string };
        if (!response.ok || !Array.isArray(data.entries)) throw new Error(data.error || "포럼 검색을 불러오지 못했습니다.");
        if (!controller.signal.aborted) setForum({ query: normalized, entries: data.entries });
      }).catch(cause => { if (!controller.signal.aborted) setForum({ query: normalized, entries: [], error: cause instanceof Error ? cause.message : "포럼 검색을 불러오지 못했습니다." }); });
    }, 220);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [open, scope, query, revision]);
  const scopedResults = useMemo(() => searchEntries(index?.entries ?? [], deferred, 24, scope), [index, deferred, scope]);
  const results = scope === "post" ? forum.query === query.trim() ? forum.entries : [] : scopedResults;
  const failure = scope === "post" ? forum.query === query.trim() ? forum.error : undefined : error;
  const loading = scope === "post" ? forum.query !== query.trim() : !index;
  const scopeLabel = searchScopes.find(item => item.kind === scope)?.label;
  function chooseScope(value: SearchKind | null) { setScope(value); input.current?.focus(); }
  function select(entry: SearchEntry) {
    if (!entry.href.startsWith("/") || entry.href.startsWith("//")) return;
    navigating.current = true; close(); router.push(entry.href);
  }
  return <Context.Provider value={{ open, show }}>{children}<Dialog.Root open={open} onOpenChange={value => { if (value) setOpen(true); else close(); }}>
    <Dialog.Portal><Dialog.Overlay className="spotlight-overlay"/><Dialog.Content className="spotlight-panel" onCloseAutoFocus={event => { if (navigating.current) event.preventDefault(); }}>
      <Dialog.Title className="sr-only">리뱅 통합 검색</Dialog.Title><Dialog.Description className="sr-only">검색 범위를 선택할 수 있습니다. 포럼에서는 글 제목과 전체 내용을 검색합니다. 방향키와 Enter로 결과를 선택하세요.</Dialog.Description>
      <Command shouldFilter={false} label="통합 검색" loop>
        <div className={`spotlight-input-row${scope ? " has-scope" : ""}`}><Search size={23}/>{scope && <button className="spotlight-scope-chip" type="button" onClick={() => chooseScope(null)} aria-label={`${scopeLabel} 검색 범위 해제`}>{scopeLabel}<X size={13}/></button>}<Command.Input ref={input} aria-label="통합 검색어" autoFocus placeholder={scope === "post" ? "글 제목 또는 내용 검색" : scope ? `${scopeLabel} 검색` : "무엇을 찾고 있나요?"} value={query} onValueChange={setQuery} maxLength={100} onKeyDown={event => { if (event.key === "Backspace" && !query && scope && !event.nativeEvent.isComposing) { event.preventDefault(); chooseScope(null); } }}/><Dialog.Close className="spotlight-close" aria-label="검색 닫기"><X size={19}/></Dialog.Close></div>
        <div className="spotlight-scopes" role="group" aria-label="검색 범위"><button type="button" aria-pressed={!scope} onClick={() => chooseScope(null)}>전체</button>{searchScopes.map(item => <button key={item.kind} type="button" aria-pressed={scope === item.kind} onClick={() => chooseScope(item.kind)}>{item.label}</button>)}</div>
        <Command.List className="spotlight-results" aria-busy={loading && !failure || query !== deferred}>
          {failure ? <div className="spotlight-state" role="status"><p>{failure}</p><button type="button" onClick={() => { setError(""); setRevision(value => value + 1); }}>다시 불러오기</button></div> : loading ? <div className="spotlight-state" role="status">{scope === "post" ? "글 제목과 내용을 찾고 있어요…" : "검색할 내용을 준비하고 있어요…"}</div> : results.length ? <>
            {!query.trim() && <p className="spotlight-section-label">{scope === "post" ? "최근 포럼 글" : scope ? `${scopeLabel} 둘러보기` : "바로 가기"}</p>}
            {results.map(entry => <Command.Item className="spotlight-result" key={entry.id} value={entry.id} onSelect={() => select(entry)}><span className="spotlight-result-icon">{entry.kind === "post" ? <MessageSquare size={19}/> : entry.kind === "guide" ? <BookOpen size={19}/> : <Search size={19}/>}</span><span><small>{searchLabels[entry.kind]}</small><strong>{entry.title}</strong><span>{entry.description}</span></span><ArrowRight size={18}/></Command.Item>)}
          </> : <div className="spotlight-state"><strong>찾는 결과가 없습니다.</strong><p>{scope === "post" ? "글 제목이나 내용의 다른 단어로 검색해 보세요." : "다른 검색어나 검색 범위를 선택해 보세요."}</p></div>}
        </Command.List>
        <div className="spotlight-footer"><span>{scope === "post" ? "포럼 글 제목 · 전체 내용 검색" : index?.partial ? "일부 검색 결과는 잠시 후 다시 확인해 주세요." : "검색 범위를 선택해서 더 빠르게 찾아보세요."}</span><span><kbd>↑</kbd><kbd>↓</kbd> 선택 <kbd>↵</kbd> 이동</span></div>
      </Command>
    </Dialog.Content></Dialog.Portal>
  </Dialog.Root></Context.Provider>;
}
export function useSiteSearch() { const value = useContext(Context); if (!value) throw new Error("SearchProvider is missing"); return value; }
