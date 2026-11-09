"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { serverNames, serverSlugs, updateCategoryLabels, type ServerUpdate } from "@/lib/portal-types";
export default function UpdatesClient({ updates }: { updates: ServerUpdate[] }) {
  const search = useSearchParams(); const [server, setServer] = useState(serverSlugs.some(slug => slug === search.get("server")) ? search.get("server")! : "all"); const [category, setCategory] = useState("all");
  const visible = updates.filter(update => (server === "all" || update.serverSlug === server) && (category === "all" || update.category === category));
  return <><div className="server-updates-toolbar"><div className="choice-scroll" role="group" aria-label="서버 소식 필터">{["all", ...serverSlugs].map(slug => <button key={slug} type="button" aria-pressed={server === slug} onClick={() => setServer(slug)}>{slug === "all" ? "전체 서버" : serverNames[slug]}</button>)}</div><label><span className="sr-only">소식 종류</span><select value={category} onChange={event => setCategory(event.target.value)}><option value="all">모든 소식</option>{Object.entries(updateCategoryLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label></div>
    <div className="server-update-list">{visible.length ? visible.map(update => <article className="server-update" id={`update-${update.id}`} key={update.id}><div className="server-update-date"><time dateTime={update.createdAt}>{new Date(update.createdAt).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "Asia/Seoul" })}</time><span>{updateCategoryLabels[update.category]}</span></div><div><span className="server-update-server">{serverNames[update.serverSlug]}</span><h2>{update.title}</h2><p>{update.content}</p>{update.updatedAt !== update.createdAt && <small>최근 수정 {new Date(update.updatedAt).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })}</small>}</div></article>) : <div className="portal-empty"><h2>아직 게시된 소식이 없습니다.</h2><p>새로운 운영 안내와 개발 현황이 이곳에 올라옵니다.</p></div>}</div>
  </>;
}
