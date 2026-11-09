"use client";

import { useMemo, useState } from "react";
import Link from "@/components/site-link";
import { ArrowRight, Search } from "@/components/site-icons";
import { channelLabels, minecraftDate, versionChannel, type MinecraftVersion, type VersionChannel } from "@/lib/minecraft-catalog";

export default function VersionLibrary({ versions, latest }: { versions: MinecraftVersion[]; latest: { release: string; snapshot: string } | null }) {
  const [query, setQuery] = useState("");
  const [channel, setChannel] = useState<VersionChannel>("all");
  const [year, setYear] = useState("");
  const [limit, setLimit] = useState(40);
  const years = useMemo(() => [...new Set(versions.map(version => new Date(version.releaseTime).getFullYear()))].sort((a, b) => b - a), [versions]);
  const filtered = useMemo(() => versions.filter(version => version.id.toLowerCase().includes(query.trim().toLowerCase()) && (channel === "all" || versionChannel(version) === channel) && (!year || String(new Date(version.releaseTime).getFullYear()) === year)), [versions, query, channel, year]);
  return <section aria-label="Java Edition 버전 검색">
    <div className="mc-library-tools"><label className="mc-search"><Search size={19}/><span className="sr-only">버전 검색</span><input type="search" placeholder="버전 검색 (예: 1.21, 26.3, 24w)" value={query} onChange={event => { setQuery(event.target.value); setLimit(40); }}/></label><label className="mc-year"><span>출시 연도</span><select value={year} onChange={event => { setYear(event.target.value); setLimit(40); }}><option value="">전체 연도</option>{years.map(year => <option value={year} key={year}>{year}년</option>)}</select></label></div>
    <div className="mc-filters" role="group" aria-label="버전 종류">{(Object.entries(channelLabels) as [VersionChannel, string][]).map(([key, label]) => <button type="button" key={key} aria-pressed={channel === key} onClick={() => { setChannel(key); setLimit(40); }}>{label}</button>)}</div>
    <div className="mc-results-heading"><p role="status">총 <strong>{filtered.length.toLocaleString("ko-KR")}</strong>개 버전</p><span>최신 공개순 · Java Edition</span></div>
    <div className="mc-version-list">{filtered.slice(0, limit).map(version => { const type = versionChannel(version); return <Link className="mc-version-row" href={`/minecraft/versions/${encodeURIComponent(version.id)}`} key={version.id}>
      <div className="mc-version-name"><strong>{version.id}</strong>{version.id === latest?.release && <span className="mc-latest-label">최신 정식</span>}{version.id === latest?.snapshot && version.id !== latest?.release && <span className="mc-latest-label">최신 테스트</span>}</div><span className={`mc-badge mc-badge-${type}`}>{channelLabels[type]}</span><time dateTime={version.releaseTime}>{minecraftDate(version.releaseTime)}</time><ArrowRight size={18}/>
    </Link>; })}</div>
    {!filtered.length && <div className="mc-empty"><h3>일치하는 버전이 없습니다.</h3><p>검색어나 필터를 바꿔 다시 찾아보세요.</p><button className="text-link" type="button" onClick={() => { setQuery(""); setChannel("all"); setYear(""); setLimit(40); }}>검색 초기화 <ArrowRight size={16}/></button></div>}
    {filtered.length > limit && <button className="btn btn-quiet mc-load-more" type="button" onClick={() => setLimit(value => value + 40)}>버전 더 보기 <span>{Math.min(limit, filtered.length)} / {filtered.length}</span></button>}
  </section>;
}
