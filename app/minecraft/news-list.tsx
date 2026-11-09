"use client";

import { useState } from "react";
import Link from "@/components/site-link";
import { ArrowRight, ArrowUpRight } from "@/components/site-icons";
import { minecraftDate, type MinecraftNews } from "@/lib/minecraft-catalog";

export default function NewsList({ news }: { news: MinecraftNews[] }) {
  const [filter, setFilter] = useState("all");
  const [limit, setLimit] = useState(6);
  const filtered = news.filter(entry => filter === "all" || entry.type === filter);
  return <>
    <div className="mc-filters" role="group" aria-label="업데이트 소식 필터">{[{ id: "all", label: "전체 소식" }, { id: "release", label: "정식 출시" }, { id: "snapshot", label: "테스트 버전" }].map(item => <button type="button" key={item.id} aria-pressed={filter === item.id} onClick={() => { setFilter(item.id); setLimit(6); }}>{item.label}</button>)}</div>
    <div className="mc-news-grid">{filtered.slice(0, limit).map(entry => <article className="mc-news-card" key={entry.id}>
      {entry.image && <a className="mc-news-art" href={entry.url} target="_blank" rel="noopener noreferrer" tabIndex={-1} aria-hidden="true"><img src={entry.image.url} alt="" width={540} height={540} loading="lazy" decoding="async"/></a>}
      <div className="mc-news-meta"><span className={`mc-badge mc-badge-${entry.type}`}>{entry.type === "release" ? "정식 출시" : "테스트 버전"}</span><time dateTime={entry.date}>{minecraftDate(entry.date)}</time></div>
      <h3><a href={entry.url} target="_blank" rel="noopener noreferrer">{entry.updateName ? `${entry.version} ${entry.updateName}` : entry.title}<ArrowUpRight size={18}/></a></h3><p lang="en">{entry.summary || "새로운 변경 사항과 수정 내역을 공식 패치 노트에서 확인하세요."}</p>
      <div className="mc-news-links"><a href={entry.url} target="_blank" rel="noopener noreferrer">공식 패치 노트 <ArrowUpRight size={15}/></a><Link href={`/minecraft/versions/${encodeURIComponent(entry.version)}`}>버전 정보 <ArrowRight size={15}/></Link></div>
    </article>)}</div>
    {!filtered.length && <p className="mc-empty">표시할 업데이트 소식이 없습니다.</p>}
    {filtered.length > limit && <button type="button" className="btn btn-quiet mc-load-more" onClick={() => setLimit(value => value + 6)}>소식 더 보기 <span>{Math.min(limit, filtered.length)} / {filtered.length}</span></button>}
  </>;
}
