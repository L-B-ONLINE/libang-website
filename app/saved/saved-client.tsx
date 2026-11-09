"use client";

import { useState } from "react";
import Link from "@/components/site-link";
import { ArrowRight, Bookmark, Search } from "@/components/site-icons";
import { useAuth } from "../auth-provider";
import { BookmarkButton, useBookmarks } from "../bookmarks-provider";
import PageFrame from "../page-frame";
const labels = { post: "포럼", guide: "가이드", version: "마크 버전" };
export default function SavedClient() {
  const { session, loading: authLoading } = useAuth(); const { entries, loading, error, refresh } = useBookmarks();
  const [kind, setKind] = useState("all"); const [query, setQuery] = useState("");
  const filtered = entries.filter(entry => (kind === "all" || entry.kind === kind) && entry.title.toLowerCase().includes(query.trim().toLowerCase()));
  return <PageFrame title="내 보관함" className="saved-page">
    <p className="portal-intro">다시 보고 싶은 가이드와 버전, 게시글을 한곳에 모아두세요.</p>
    {authLoading || loading ? <p className="portal-state" role="status">보관함을 불러오는 중…</p> : !session ? <div className="portal-empty"><Bookmark size={32}/><h2>나만의 보관함을 시작하세요.</h2><p>각 문서의 저장 아이콘을 누르면 계정에 보관됩니다.</p><Link className="btn btn-primary" href="/login?return_to=%2Fsaved">로그인 <ArrowRight size={17}/></Link></div> : <>
      <div className="saved-toolbar"><div className="choice-scroll" role="group" aria-label="보관함 종류">{[{ key: "all", label: "전체" }, ...Object.entries(labels).map(([key, label]) => ({ key, label }))].map(item => <button type="button" key={item.key} aria-pressed={kind === item.key} onClick={() => setKind(item.key)}>{item.label}</button>)}</div><label className="portal-search-field"><Search size={17}/><span className="sr-only">보관함 검색</span><input type="search" placeholder="저장한 항목 검색" value={query} onChange={event => setQuery(event.target.value)}/></label></div>
      {error ? <div className="portal-empty" role="alert"><p>{error}</p><button className="btn btn-quiet" type="button" onClick={refresh}>다시 불러오기</button></div> : filtered.length ? <div className="saved-list">{filtered.map(entry => <div className="saved-row" key={`${entry.kind}:${entry.resourceId}`}><Link href={entry.href}><span>{labels[entry.kind]}</span><strong>{entry.title}</strong><ArrowRight size={18}/></Link><BookmarkButton {...entry} compact/></div>)}</div> : <div className="portal-empty"><Bookmark size={30}/><h2>{entries.length ? "조건에 맞는 저장 항목이 없습니다." : "아직 저장한 항목이 없어요."}</h2><p>가이드, 마크 버전, 게시글의 저장 아이콘을 눌러보세요.</p><div className="portal-empty-links"><Link href="/guide">가이드 <ArrowRight size={16}/></Link><Link href="/minecraft/versions">마크 버전 <ArrowRight size={16}/></Link><Link href="/forum">포럼 <ArrowRight size={16}/></Link></div></div>}
    </>}
  </PageFrame>;
}
