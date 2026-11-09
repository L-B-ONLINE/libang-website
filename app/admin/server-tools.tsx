"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Copy, Refresh, Save } from "@/components/site-icons";
import { serverNames, serverSlugs, updateCategoryLabels, type ServerUpdate } from "@/lib/portal-types";
import type { AdminRequest } from "./admin-workspace";
const empty = { serverSlug: "dongwon", category: "announcement" as ServerUpdate["category"], title: "", content: "", published: false };
const messageOf = (error: unknown) => error instanceof Error ? error.message : "요청을 처리하지 못했습니다.";

export function ServerUpdatesAdmin({ request, onDirty }: { request: AdminRequest; onDirty: (value: boolean) => void }) {
  const [updates, setUpdates] = useState<ServerUpdate[]>([]); const [selected, setSelected] = useState<number | null>(null); const [draft, setDraft] = useState(empty);
  const [error, setError] = useState(""); const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  const original = updates.find(update => update.id === selected);
  const changed = original ? ["serverSlug", "category", "title", "content", "published"].some(key => original[key as keyof ServerUpdate] !== draft[key as keyof typeof draft]) : Boolean(draft.title || draft.content);
  useEffect(() => { onDirty(changed); }, [changed, onDirty]);
  useEffect(() => { let active = true; void request<{ updates: ServerUpdate[] }>("/api/admin/server-updates").then(data => { if (active) { setUpdates(data.updates); setError(""); } }).catch(error => { if (active) setError(messageOf(error)); }); return () => { active = false; }; }, [request]);
  function choose(update: ServerUpdate | null) {
    if (changed && !window.confirm("작성 중인 내용을 버리고 이동할까요?")) return;
    setSelected(update?.id ?? null); setDraft(update ? { serverSlug: update.serverSlug, category: update.category, title: update.title, content: update.content, published: update.published } : empty); setMessage(""); setError(""); onDirty(false);
  }
  async function save() {
    if (busy) return; setBusy(true); setError(""); setMessage("");
    try {
      const result = await request<{ id: number }>("/api/admin/server-updates", { method: selected ? "PATCH" : "POST", body: JSON.stringify({ ...draft, ...(selected ? { id: selected } : {}) }) });
      const now = new Date().toISOString(); const entry: ServerUpdate = { ...draft, id: result.id, createdAt: original?.createdAt ?? now, updatedAt: now };
      setUpdates(value => [entry, ...value.filter(update => update.id !== entry.id)]); setSelected(entry.id); onDirty(false); setMessage(draft.published ? "서버 소식에 게시했습니다." : "초안으로 저장했습니다.");
    } catch (error) { setError(messageOf(error)); } finally { setBusy(false); }
  }
  async function remove() {
    if (!selected || !window.confirm("이 서버 소식을 삭제할까요?")) return;
    setBusy(true); try { await request("/api/admin/server-updates", { method: "DELETE", body: JSON.stringify({ id: selected }) }); setUpdates(value => value.filter(update => update.id !== selected)); setSelected(null); setDraft(empty); onDirty(false); setMessage("삭제했습니다."); } catch (error) { setError(messageOf(error)); } finally { setBusy(false); }
  }
  return <><p className="portal-admin-message">게임 업데이트, 개발 진행과 점검 안내를 기록하세요. 초안은 운영진에게만 표시됩니다.</p>{error && <p className="form-error" role="alert">{error}</p>}{message && <p className="admin-success" role="status">{message}</p>}<div className="portal-admin-layout"><div className="portal-admin-list"><button type="button" onClick={() => choose(null)}><strong>새 소식 작성</strong><small>안내 · 업데이트 · 개발 · 점검</small></button>{updates.map(update => <button type="button" key={update.id} aria-pressed={selected === update.id} onClick={() => choose(update)}><small>{serverNames[update.serverSlug]} · {update.published ? "게시됨" : "초안"}</small><strong>{update.title}</strong></button>)}</div>
    <form className="portal-admin-editor" onSubmit={event => { event.preventDefault(); void save(); }}><h3>{selected ? "소식 수정" : "새 소식"}</h3><label>서버<select value={draft.serverSlug} onChange={event => setDraft(value => ({ ...value, serverSlug: event.target.value }))}>{serverSlugs.map(slug => <option key={slug} value={slug}>{serverNames[slug]}</option>)}</select></label><label>종류<select value={draft.category} onChange={event => setDraft(value => ({ ...value, category: event.target.value as ServerUpdate["category"] }))}>{Object.entries(updateCategoryLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><label>제목<input value={draft.title} required minLength={2} maxLength={120} onChange={event => setDraft(value => ({ ...value, title: event.target.value }))}/></label><label>내용<textarea value={draft.content} required minLength={2} maxLength={10000} onChange={event => setDraft(value => ({ ...value, content: event.target.value }))}/></label><label className="portal-checkbox"><input type="checkbox" checked={draft.published} onChange={event => setDraft(value => ({ ...value, published: event.target.checked }))}/>공개 게시</label><div className="portal-admin-actions"><button className="btn btn-primary" type="submit" disabled={busy || !changed}><Save size={16}/>{busy ? "저장 중…" : "저장"}</button>{selected && <button className="btn btn-quiet" type="button" disabled={busy} onClick={() => void remove()}>삭제</button>}</div></form>
  </div></>;
}

type Connection = { serverSlug: string; connectedAt: string; lastSeen: string | null };
type Pair = { code: string; command: string; serverSlug: string; expiresAt: string };
export function ServerBridgeAdmin({ request }: { request: AdminRequest }) {
  const [connections, setConnections] = useState<Connection[]>([]); const [slug, setSlug] = useState("network"); const [pair, setPair] = useState<Pair | null>(null);
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false); const [copied, setCopied] = useState(false); const [revision, setRevision] = useState(0);
  useEffect(() => { let active = true; void request<{ connections: Connection[] }>("/api/admin/server-bridge").then(data => { if (active) { setConnections(data.connections); setError(""); } }).catch(error => { if (active) setError(messageOf(error)); }); return () => { active = false; }; }, [request, revision]);
  async function issue() { setBusy(true); setPair(null); setCopied(false); setError(""); try { setPair(await request<Pair>("/api/admin/server-bridge", { method: "POST", body: JSON.stringify({ serverSlug: slug }) })); } catch (error) { setError(messageOf(error)); } finally { setBusy(false); } }
  async function revoke(serverSlug: string) { if (!window.confirm(`${serverNames[serverSlug]}의 사이트 연동을 해제할까요?`)) return; setBusy(true); try { await request("/api/admin/server-bridge", { method: "DELETE", body: JSON.stringify({ serverSlug }) }); setConnections(value => value.filter(connection => connection.serverSlug !== serverSlug)); setPair(null); } catch (error) { setError(messageOf(error)); } finally { setBusy(false); } }
  async function copy() { try { await navigator.clipboard.writeText(pair?.command ?? ""); setCopied(true); } catch { setError("명령어를 선택해 복사해 주세요."); } }
  return <div className="bridge-panel"><h3>게임 서버와 사이트 연결</h3><p>Velocity는 리뱅 네트워크에, Leaf/Paper는 각 게임 서버에 연결하세요. 일회용 연결 코드를 플러그인에서 입력하면 서버 상태와 접속 인원을 자동으로 보냅니다.</p><p>연결 코드는 10분 동안 한 번만 사용할 수 있습니다. 새 연결을 완료하면 해당 서버의 기존 연결 키가 교체됩니다.</p>
    {error && <p className="form-error" role="alert">{error}</p>}<label><span className="sr-only">연결할 서버</span><select className="bridge-server-select" value={slug} onChange={event => { setSlug(event.target.value); setPair(null); }}>{serverSlugs.map(slug => <option value={slug} key={slug}>{serverNames[slug]}</option>)}</select></label><div className="portal-admin-actions"><button className="btn btn-primary" type="button" disabled={busy} onClick={() => void issue()}>{busy ? "처리 중…" : "연결 코드 발급"}<ArrowRight size={17}/></button><button className="btn btn-quiet" type="button" disabled={busy} onClick={() => setRevision(value => value + 1)}><Refresh size={15}/>연결 상태 새로고침</button></div>
    {pair && <div className="bridge-code"><p>{serverNames[pair.serverSlug]} · {new Date(pair.expiresAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Seoul" })}까지 유효</p><p>해당 서버의 콘솔에서 실행하세요. 게임 안에서는 앞에 /를 붙여 실행할 수 있습니다.</p><code>{pair.command}</code><button type="button" className="btn btn-quiet" onClick={() => void copy()}><Copy size={16}/>{copied ? "복사됨" : "명령어 복사"}</button></div>}
    <div className="bridge-connections">{serverSlugs.map(serverSlug => { const connection = connections.find(value => value.serverSlug === serverSlug); return <div className="bridge-connection" key={serverSlug}><strong>{serverNames[serverSlug]}</strong><span>{connection ? "연결 키 발급됨" : "아직 연결하지 않았습니다."}</span>{connection?.lastSeen && <time>최근 신호 {new Date(connection.lastSeen).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}</time>}{connection && <button className="text-link" type="button" disabled={busy} onClick={() => void revoke(serverSlug)}>연동 해제</button>}</div>; })}</div>
  </div>;
}
