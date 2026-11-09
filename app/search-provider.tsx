"use client";

import { createContext, useCallback, useContext, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "radix-ui";
import { Command } from "cmdk";
import { ArrowRight, BookOpen, MessageSquare, Search, X } from "@/components/site-icons";
import { searchEntries, searchLabels, type SearchEntry } from "@/lib/search-model";
const Context = createContext<{ open: boolean; show: () => void } | null>(null);

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter(); const [open, setOpen] = useState(false); const [query, setQuery] = useState("");
  const [index, setIndex] = useState<{ entries: SearchEntry[]; partial: boolean } | null>(null); const [error, setError] = useState(""); const [revision, setRevision] = useState(0);
  const navigating = useRef(false); const deferred = useDeferredValue(query);
  const show = useCallback(() => { window.dispatchEvent(new Event("libang:close-menus")); navigating.current = false; setOpen(true); }, []);
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); if (open) setOpen(false); else show(); } };
    window.addEventListener("keydown", keydown); return () => window.removeEventListener("keydown", keydown);
  }, [open, show]);
  useEffect(() => {
    if (!open || index) return;
    const controller = new AbortController();
    void fetch("/api/search", { signal: controller.signal }).then(async response => {
      const body = await response.json() as { entries: SearchEntry[]; partial?: boolean };
      if (!response.ok || !Array.isArray(body.entries)) throw new Error("검색 정보를 불러오지 못했습니다.");
      if (!controller.signal.aborted) { setIndex({ entries: body.entries, partial: Boolean(body.partial) }); setError(""); }
    }).catch(cause => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "검색 정보를 불러오지 못했습니다."); });
    return () => controller.abort();
  }, [open, index, revision]);
  const results = useMemo(() => searchEntries(index?.entries ?? [], deferred), [index, deferred]);
  function select(entry: SearchEntry) {
    if (!entry.href.startsWith("/") || entry.href.startsWith("//")) return;
    navigating.current = true; setOpen(false); setQuery(""); router.push(entry.href);
  }
  return <Context.Provider value={{ open, show }}>{children}<Dialog.Root open={open} onOpenChange={value => { setOpen(value); if (!value) setQuery(""); }}>
    <Dialog.Portal><Dialog.Overlay className="spotlight-overlay"/><Dialog.Content className="spotlight-panel" onCloseAutoFocus={event => { if (navigating.current) event.preventDefault(); }}>
      <Dialog.Title className="sr-only">리뱅 통합 검색</Dialog.Title><Dialog.Description className="sr-only">서버, 가이드, 포럼 게시글과 마인크래프트 버전을 검색하세요. 방향키로 선택하고 Enter로 이동합니다.</Dialog.Description>
      <Command shouldFilter={false} label="통합 검색" loop>
        <div className="spotlight-input-row"><Search size={23}/><Command.Input aria-label="통합 검색어" autoFocus placeholder="무엇을 찾고 있나요?" value={query} onValueChange={setQuery} maxLength={100}/><Dialog.Close className="spotlight-close" aria-label="검색 닫기"><X size={19}/></Dialog.Close></div>
        <Command.List className="spotlight-results" aria-busy={!index && !error || query !== deferred}>
          {!index ? <div className="spotlight-state" role="status">{error ? <><p>{error}</p><button type="button" onClick={() => { setError(""); setRevision(value => value + 1); }}>다시 불러오기</button></> : "검색할 내용을 준비하고 있어요…"}</div> : results.length ? <>
            {!query.trim() && <p className="spotlight-section-label">바로 가기</p>}
            {results.map(entry => <Command.Item className="spotlight-result" key={entry.id} value={entry.id} onSelect={() => select(entry)}><span className="spotlight-result-icon">{entry.kind === "post" ? <MessageSquare size={19}/> : entry.kind === "guide" ? <BookOpen size={19}/> : <Search size={19}/>}</span><span><small>{searchLabels[entry.kind]}</small><strong>{entry.title}</strong><span>{entry.description}</span></span><ArrowRight size={18}/></Command.Item>)}
          </> : <div className="spotlight-state"><strong>찾는 결과가 없습니다.</strong><p>서버 이름이나 버전, 문서 제목으로 다시 검색해 보세요.</p></div>}
        </Command.List>
        <div className="spotlight-footer"><span>{index?.partial ? "일부 검색 결과는 잠시 후 다시 확인해 주세요." : "서버 · 가이드 · 포럼 · 마크 버전"}</span><span><kbd>↑</kbd><kbd>↓</kbd> 선택 <kbd>↵</kbd> 이동</span></div>
      </Command>
    </Dialog.Content></Dialog.Portal>
  </Dialog.Root></Context.Provider>;
}
export function useSiteSearch() { const value = useContext(Context); if (!value) throw new Error("SearchProvider is missing"); return value; }
