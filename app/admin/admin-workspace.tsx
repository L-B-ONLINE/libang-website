"use client";
import Link from "@/components/site-link";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, Check, Copy, LayoutDashboard, MessageSquare, Pencil, Refresh, Save, Search, Shield, Trash, Users } from "@/components/site-icons";
import type { AdminAccount, AdminGuide, AdminOverview, AdminPost } from "@/lib/admin-types";

import { PlayerName } from "../player-identity";
export type AdminRequest = <T>(path: string, init?: RequestInit) => Promise<T>;
type Section = "overview" | "accounts" | "posts" | "guides";
const sections = [
  { id: "overview", label: "개요", icon: LayoutDashboard },
  { id: "accounts", label: "계정", icon: Users },
  { id: "posts", label: "게시물", icon: MessageSquare },
  { id: "guides", label: "가이드", icon: BookOpen },
] as const;
const roles = { owner: "관리자", subadmin: "부관리자", member: "일반 회원" };
const topics = { notice: "공지", free: "자유", question: "질문", development: "개발", gaming: "게임", daily: "일상" };
const guideNames: Record<string, string> = { connect: "서버 접속 방법", commands: "기본 명령어", dongwon: "Dongwon 시작하기", lokawar: "Bose 시작하기", reability: "ReAbility 시작하기", rules: "이용 규칙", faq: "자주 묻는 질문" };
const date = (value: string | null) => value ? new Date(value).toLocaleString("ko-KR", { timeZone: "Asia/Seoul", dateStyle: "medium", timeStyle: "short" }) : "기록 없음";
const messageOf = (cause: unknown) => cause instanceof Error ? cause.message : "요청을 처리하지 못했습니다.";

function Pager({ page, hasMore, busy, onChange }: { page: number; hasMore: boolean; busy: boolean; onChange: (value: number) => void }) {
  return <nav className="admin-pager" aria-label="관리 목록 페이지"><button type="button" disabled={busy || page <= 1} onClick={() => onChange(page - 1)}><ArrowLeft size={15} />이전</button><span>{page} 페이지</span><button type="button" disabled={busy || !hasMore} onClick={() => onChange(page + 1)}>다음<ArrowRight size={15} /></button></nav>;
}

function IdCopy({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  async function copy() {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(value);
      else throw new Error();
      setCopied(true); setFailed(false);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2200);
    } catch { setFailed(true); }
  }
  return <div className="admin-id"><span>계정 ID</span><code>{value}</code><button type="button" onClick={() => void copy()}>{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? "복사됨" : "ID 복사"}</button>{failed && <small role="status">위 ID를 선택해 복사하세요.</small>}</div>;
}

export default function AdminWorkspace({ request }: { request: AdminRequest }) {
  const [section, setSection] = useState<Section>("overview");
  const [revision, setRevision] = useState(0);
  const [dirty, setDirty] = useState(false);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  function move(next: Section) {
    if (next === section) return;
    if (dirty && !window.confirm("저장하지 않은 변경사항을 버리고 이동할까요?")) return;
    setDirty(false); setSection(next);
  }
  return <div className="admin-workspace">
    <nav className="admin-navigation" aria-label="관리 항목">{sections.map(item => <button key={item.id} type="button" aria-current={section === item.id ? "page" : undefined} onClick={() => move(item.id)}><item.icon size={18} />{item.label}</button>)}<Link href="/" className="admin-site-link">사이트 보기<ArrowUpRight size={15} /></Link></nav>
    <section className="admin-main" aria-label={sections.find(item => item.id === section)?.label}>
      <div className="admin-section-heading"><div><h2>{sections.find(item => item.id === section)?.label}</h2></div><button type="button" className="admin-refresh" onClick={() => { if (!dirty || window.confirm("변경사항을 버리고 새로 불러올까요?")) { setDirty(false); setRevision(value => value + 1); } }}><Refresh size={16} />새로고침</button></div>
      {section === "overview" && <Overview key={revision} request={request} onMove={move} />}
      {section === "accounts" && <Accounts key={revision} request={request} onDirty={setDirty} />}
      {section === "posts" && <Posts key={revision} request={request} onDirty={setDirty} />}
      {section === "guides" && <Guides key={revision} request={request} onDirty={setDirty} />}
    </section>
  </div>;
}

function Overview({ request, onMove }: { request: AdminRequest; onMove: (section: Section) => void }) {
  const [data, setData] = useState<AdminOverview | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { let active = true; void request<AdminOverview>("/api/admin?section=overview").then(value => { if (active) setData(value); }).catch(cause => { if (active) setError(messageOf(cause)); }); return () => { active = false; }; }, [request]);
  if (error) return <p className="form-error" role="alert">{error}</p>;
  if (!data) return <p className="admin-state" role="status">운영 현황을 불러오는 중…</p>;
  return <>
    <div className="admin-metrics">{[{ label: "전체 계정", value: data.totalUsers ?? "—", tab: "accounts" }, { label: "게시물", value: data.totalPosts, tab: "posts" }, { label: "공지", value: data.notices, tab: "posts" }, { label: "운영진", value: data.staffCount, tab: "accounts" }].map(item => <button type="button" key={item.label} onClick={() => onMove(item.tab as Section)}><span>{item.label}</span><strong>{typeof item.value === "number" ? item.value.toLocaleString() : item.value}</strong><ArrowUpRight size={17} /></button>)}</div>
    {data.totalUsers === null && <p className="admin-note">계정 통계를 불러오지 못했습니다. 계정 탭에서 연결 상태를 확인하세요.</p>}
    <div className="admin-block-heading"><h3>최근 게시물</h3><button type="button" onClick={() => onMove("posts")}>전체 관리<ArrowRight size={15} /></button></div>
    <div className="admin-recent">{data.recentPosts.length ? data.recentPosts.map(post => <Link href={`/forum/${post.id}`} key={post.id}><span className={`category category-${post.category}`}>{topics[post.category]}</span><strong>{post.title}</strong><span><PlayerName userId={post.authorId} name={post.authorName}/></span><ArrowUpRight size={15} /></Link>) : <p className="admin-state">작성된 게시물이 없습니다.</p>}</div>
    <div className="admin-guide-summary"><BookOpen size={23} /><div><h3>가이드 관리</h3><p>7개 문서 중 {data.customizedGuides}개 편집됨 · 접속 방법부터 FAQ까지</p></div><button type="button" onClick={() => onMove("guides")}>편집하기<ArrowRight size={15} /></button></div>
    <p className="admin-note"><Shield size={15} />계정·권한 관리는 관리자 전용입니다. 부관리자는 기존 권한에 따라 게시물과 가이드를 수정할 수 있습니다.</p>
  </>;
}

function Accounts({ request, onDirty }: { request: AdminRequest; onDirty: (value: boolean) => void }) {
  const [data, setData] = useState<{ users: AdminAccount[]; total: number; hasMore: boolean } | null>(null);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("all");
  const [selected, setSelected] = useState<AdminAccount | null>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [revision, setRevision] = useState(0);
  const detail = useRef<HTMLDivElement>(null);
  const changed = Boolean(selected && (email !== selected.email || name !== selected.name));
  useEffect(() => { onDirty(changed); }, [changed, onDirty]);
  useEffect(() => {
    let active = true; setFetching(true); setError("");
    void request<{ users: AdminAccount[]; total: number; hasMore: boolean }>(`/api/admin?section=accounts&page=${page}`).then(value => { if (active) setData(value); }).catch(cause => { if (active) setError(messageOf(cause)); }).finally(() => { if (active) setFetching(false); });
    return () => { active = false; };
  }, [request, page, revision]);
  function choose(account: AdminAccount | null) {
    if (busy || changed && !window.confirm("저장하지 않은 계정 변경사항을 버릴까요?")) return;
    setSelected(account); setEmail(account?.email || ""); setName(account?.name || ""); setMessage(""); setError("");
    if (account && window.matchMedia("(max-width: 900px)").matches) requestAnimationFrame(() => detail.current?.scrollIntoView({ block: "start", behavior: "instant" }));
  }
  async function run(action: string) {
    if (!selected || busy) return;
    const confirmations: Record<string, string> = {
      resetPassword: `${selected.email} 주소로 비밀번호 재설정 메일을 보낼까요?`,
      subadmin: `${selected.name || selected.email} 계정을 부관리자로 지정할까요?`,
      removeSubadmin: `${selected.name || selected.email} 계정의 부관리자 권한을 해제할까요?`,
      transfer: `${selected.email} 계정으로 관리자 권한을 이전할까요? 현재 계정은 관리자 권한을 잃습니다.`,
    };
    if (action !== "update" && changed) { setError("계정 정보 변경사항을 먼저 저장하거나 취소하세요."); return; }
    if (confirmations[action] && !window.confirm(confirmations[action])) return;
    setBusy(true); setError(""); setMessage("");
    try {
      await request("/api/admin", { method: "PATCH", body: JSON.stringify({ action, id: selected.id, email, name }) });
      if (action === "transfer") { window.location.assign("/"); return; }
      const updated = { ...selected, ...(action === "update" ? { email: email.trim(), name: name.trim() } : {}), ...(action === "subadmin" ? { role: "subadmin" as const } : action === "removeSubadmin" ? { role: "member" as const } : {}) };
      setSelected(updated); setEmail(updated.email); setName(updated.name); onDirty(false);
      setMessage(action === "resetPassword" ? "비밀번호 재설정 메일을 보냈습니다." : "저장했습니다."); setRevision(value => value + 1);
    } catch (cause) { setError(messageOf(cause)); } finally { setBusy(false); }
  }
  const needle = query.trim().toLowerCase();
  const visible = (data?.users || []).filter(account => (role === "all" || account.role === role) && (!needle || `${account.name} ${account.email} ${account.id}`.toLowerCase().includes(needle)));
  return <>
    <div className="admin-toolbar"><label className="admin-search"><Search size={17} /><input type="search" aria-label="이 페이지의 계정 검색" placeholder="이름, 이메일, ID 검색" value={query} onChange={event => setQuery(event.target.value)} /></label><select aria-label="계정 권한 필터" value={role} onChange={event => setRole(event.target.value)}><option value="all">모든 권한</option><option value="owner">관리자</option><option value="subadmin">부관리자</option><option value="member">일반 회원</option></select></div>
    {data && <p className="admin-result-count">전체 {data.total}개 계정 · 이 페이지 {visible.length}개{data.total > 50 && " (검색·필터는 현재 페이지에 적용)"}</p>}
    {error && !selected && <p className="form-error" role="alert">{error}</p>}
    {message && !selected && <p className="admin-success" role="status"><Check size={15} />{message}</p>}
    <div className={`admin-account-layout${selected ? " has-selection" : ""}`}>
      <div className="admin-account-list" aria-busy={fetching}><div className="admin-list-caption"><span>계정</span><span>권한</span></div>
        {fetching ? <p className="admin-state" role="status">계정을 불러오는 중…</p> : visible.length ? visible.map(account => <button type="button" key={account.id} className={selected?.id === account.id ? "selected" : ""} disabled={busy} onClick={() => choose(account)} aria-pressed={selected?.id === account.id}><span><strong><PlayerName userId={account.id} name={account.name || "이름 없음"}/></strong><small>{account.email || "이메일 없음"}</small></span><span className={`admin-role role-${account.role}`}>{roles[account.role]}</span></button>) : <p className="admin-state">{data ? "조건에 맞는 계정이 없습니다." : "계정 목록을 불러오지 못했습니다."}</p>}
        {data && <Pager page={page} hasMore={data.hasMore} busy={busy || fetching} onChange={next => { if (changed && !window.confirm("저장하지 않은 변경사항을 버릴까요?")) return; setSelected(null); setEmail(""); setName(""); onDirty(false); setPage(next); }} />}
      </div>
      <div className="admin-account-detail" ref={detail}>
        {selected ? <><div className="admin-detail-heading"><h3>계정 상세</h3><button type="button" disabled={busy} onClick={() => choose(null)}>닫기</button></div>{error && <p className="form-error" role="alert">{error}</p>}{message && <p className="admin-success" role="status"><Check size={15} />{message}</p>}<IdCopy value={selected.id} />
          <dl className="admin-facts"><div><dt>이메일 인증</dt><dd>{selected.confirmed ? "인증됨" : "미인증"}</dd></div><div><dt>가입일</dt><dd>{date(selected.createdAt)}</dd></div><div><dt>최근 로그인</dt><dd>{date(selected.lastSignInAt)}</dd></div><div><dt>로그인 방식</dt><dd>{selected.providers.join(" · ") || "기록 없음"}</dd></div></dl>
          <form className="admin-form" onSubmit={event => { event.preventDefault(); void run("update"); }}><label>아이디<input value={name} minLength={2} maxLength={40} required disabled={busy} onChange={event => setName(event.target.value)} autoComplete="off" /></label><label>이메일<input type="email" value={email} maxLength={254} required disabled={busy} onChange={event => setEmail(event.target.value)} autoComplete="off" /></label><div className="admin-form-actions"><button className="admin-primary" type="submit" disabled={busy || !changed}><Save size={16} />{busy ? "처리 중…" : "변경 저장"}</button>{changed && <button type="button" disabled={busy} onClick={() => { setEmail(selected.email); setName(selected.name); }}>취소</button>}</div></form>
          <div className="admin-detail-section"><h4>계정 보안</h4><p>비밀번호는 조회할 수 없습니다. 계정 이메일로 재설정 링크를 보냅니다.</p><button type="button" disabled={busy || !selected.email || changed} onClick={() => void run("resetPassword")}>비밀번호 재설정 메일</button></div>
          <div className="admin-detail-section"><h4>운영 권한</h4><p>현재 권한: {roles[selected.role]}</p>{selected.role !== "owner" ? <><button type="button" disabled={busy || changed} onClick={() => void run(selected.role === "subadmin" ? "removeSubadmin" : "subadmin")}>{selected.role === "subadmin" ? "부관리자 해제" : "부관리자 지정"}</button><div className="admin-danger-zone"><span>관리자 이전</span><p>이 계정에 관리자를 넘기면 현재 계정의 관리자 권한이 사라집니다.</p><button type="button" className="admin-danger" disabled={busy || changed || !selected.confirmed} onClick={() => void run("transfer")}>관리자 권한 이전</button>{!selected.confirmed && <p className="admin-note">이메일 인증을 완료한 계정으로만 이전할 수 있습니다.</p>}</div></> : <p className="admin-note">관리자 이전은 권한을 받을 계정을 선택한 뒤 진행하세요.</p>}</div>
        </> : <div className="admin-detail-empty"><Users size={28} /><h3>계정을 선택하세요</h3><p>정보 수정, 인증 상태 확인, 비밀번호 재설정과 운영 권한을 관리할 수 있습니다.</p></div>}
      </div>
    </div>
  </>;
}

function Posts({ request, onDirty }: { request: AdminRequest; onDirty: (value: boolean) => void }) {
  const [data, setData] = useState<{ posts: AdminPost[]; total: number; perPage: number } | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<AdminPost | null>(null);
  const [draft, setDraft] = useState({ category: "free", title: "", content: "" });
  const [busy, setBusy] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [revision, setRevision] = useState(0);
  const changed = Boolean(editing && (editing.title !== draft.title || editing.content !== draft.content || editing.category !== draft.category));
  useEffect(() => { onDirty(changed); }, [changed, onDirty]);
  useEffect(() => {
    let active = true; setFetching(true); setError("");
    const timer = setTimeout(() => { void request<{ posts: AdminPost[]; total: number; perPage: number }>(`/api/admin?section=posts&page=${page}&category=${category}&q=${encodeURIComponent(query.trim())}`).then(value => { if (active) { setData(value); const last = Math.max(1, Math.ceil(value.total / value.perPage)); if (page > last) setPage(last); } }).catch(cause => { if (active) setError(messageOf(cause)); }).finally(() => { if (active) setFetching(false); }); }, 200);
    return () => { active = false; clearTimeout(timer); };
  }, [request, page, category, query, revision]);
  function edit(post: AdminPost | null) {
    if (busy || changed && !window.confirm("저장하지 않은 게시물 변경사항을 버릴까요?")) return;
    setEditing(post); if (post) setDraft({ category: post.category, title: post.title, content: post.content }); setMessage("");
  }
  async function save() {
    if (!editing || busy) return;
    setBusy(true); setError(""); setMessage("");
    try { await request(`/api/posts/${editing.id}`, { method: "PATCH", body: JSON.stringify(draft) }); setEditing(null); onDirty(false); setMessage("게시물을 수정했습니다. 글에 수정됨이 표시됩니다."); setRevision(value => value + 1); } catch (cause) { setError(messageOf(cause)); } finally { setBusy(false); }
  }
  async function remove(post: AdminPost) {
    if (busy || !window.confirm(`“${post.title}” 글을 삭제할까요? 삭제한 글은 복구할 수 없습니다.`)) return;
    setBusy(true); setError(""); setMessage("");
    try { await request(`/api/posts/${post.id}`, { method: "DELETE" }); setMessage("게시물을 삭제했습니다."); setRevision(value => value + 1); } catch (cause) { setError(messageOf(cause)); } finally { setBusy(false); }
  }
  return <>
    {error && <p className="form-error" role="alert">{error}</p>}{message && <p className="admin-success" role="status"><Check size={15} />{message}</p>}
    {editing ? <form className="admin-form admin-post-editor" onSubmit={event => { event.preventDefault(); void save(); }}><div className="admin-detail-heading"><h3>게시물 수정</h3><Link href={`/forum/${editing.id}`} target="_blank" rel="noreferrer">원문 보기<ArrowUpRight size={15} /></Link></div><label>주제<select disabled={busy} value={draft.category} onChange={event => setDraft({ ...draft, category: event.target.value })}>{Object.entries(topics).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><label>제목<input required maxLength={120} disabled={busy} value={draft.title} onChange={event => setDraft({ ...draft, title: event.target.value })} /></label><label>내용<textarea required maxLength={10000} disabled={busy} rows={12} value={draft.content} onChange={event => setDraft({ ...draft, content: event.target.value })} /></label><span className="admin-character-count">{draft.content.length.toLocaleString()} / 10,000</span><div className="admin-form-actions"><button type="submit" className="admin-primary" disabled={busy || !changed || !draft.title.trim() || !draft.content.trim()}><Save size={16} />수정 저장</button><button type="button" disabled={busy} onClick={() => edit(null)}>취소</button></div></form> : <>
      <div className="admin-toolbar"><label className="admin-search"><Search size={17} /><input type="search" value={query} aria-label="모든 게시물 검색" placeholder="제목, 내용, 작성자 검색" onChange={event => { setQuery(event.target.value); setPage(1); }} /></label><select aria-label="게시물 주제 필터" value={category} onChange={event => { setCategory(event.target.value); setPage(1); }}><option value="all">모든 주제</option>{Object.entries(topics).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select><Link className="admin-button" href="/forum">포럼 열기<ArrowUpRight size={15} /></Link></div>
      <p className="admin-result-count" role="status">{fetching ? "불러오는 중…" : `${data?.total ?? 0}개의 게시물`}</p>
      <div className="admin-post-list" aria-busy={fetching}>{fetching ? <p className="admin-state">게시물을 불러오는 중…</p> : data?.posts.length ? data.posts.map(post => <article key={post.id}><div className="admin-post-summary"><span className={`category category-${post.category}`}>{topics[post.category]}</span><Link href={`/forum/${post.id}`}><strong>{post.title}</strong></Link><small><PlayerName userId={post.authorId} name={post.authorName}/> · {date(post.createdAt)}{post.updatedAt && " · 수정됨"}</small></div><div className="admin-row-actions"><button type="button" disabled={busy} onClick={() => edit(post)}><Pencil size={15} />수정</button><button type="button" className="admin-danger" disabled={busy} onClick={() => void remove(post)}><Trash size={15} />삭제</button></div></article>) : <p className="admin-state">조건에 맞는 게시물이 없습니다.</p>}</div>
      {data && <Pager page={page} hasMore={page * data.perPage < data.total} busy={busy || fetching} onChange={setPage} />}
    </>}
  </>;
}

function Guides({ request, onDirty }: { request: AdminRequest; onDirty: (value: boolean) => void }) {
  const [guides, setGuides] = useState<AdminGuide[]>([]);
  const [selected, setSelected] = useState("connect");
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const current = guides.find(guide => guide.key === selected);
  const changed = Boolean(current && current.content !== content);
  useEffect(() => { onDirty(changed); }, [changed, onDirty]);
  useEffect(() => { let active = true; void request<{ guides: AdminGuide[] }>("/api/admin?section=guides").then(data => { if (active) { setGuides(data.guides); setSelected(data.guides[0]?.key || "connect"); setContent(data.guides[0]?.content || ""); } }).catch(cause => { if (active) setError(messageOf(cause)); }); return () => { active = false; }; }, [request]);
  function choose(key: string) {
    if (busy || key === selected || changed && !window.confirm("저장하지 않은 가이드 변경사항을 버릴까요?")) return;
    setSelected(key); setContent(guides.find(guide => guide.key === key)?.content || ""); setMessage(""); setError("");
  }
  async function save() {
    if (busy || !current) return;
    setBusy(true); setError(""); setMessage("");
    try { const trimmed = content.trim(); await request(`/api/guide/${selected}`, { method: "PUT", body: JSON.stringify({ content: trimmed }) }); setGuides(values => values.map(guide => guide.key === selected ? { ...guide, content: trimmed, customized: true, updatedAt: new Date().toISOString() } : guide)); setContent(trimmed); onDirty(false); setMessage("가이드를 저장했습니다. 공개 페이지에 바로 반영됩니다."); } catch (cause) { setError(messageOf(cause)); } finally { setBusy(false); }
  }
  return <>{error && <p className="form-error" role="alert">{error}</p>}{message && <p className="admin-success" role="status"><Check size={15} />{message}</p>}
    {guides.length ? <div className="admin-guide-layout"><nav aria-label="편집할 가이드" className="admin-guide-list">{guides.map(guide => <button type="button" key={guide.key} aria-current={guide.key === selected ? "page" : undefined} disabled={busy} onClick={() => choose(guide.key)}>{guideNames[guide.key]}<span>{guide.customized ? "편집됨" : "기본 문서"}</span></button>)}</nav><form className="admin-form admin-guide-editor" onSubmit={event => { event.preventDefault(); void save(); }}><div className="admin-detail-heading"><h3>{guideNames[selected]}</h3><Link href={`/guide#${selected}`} target="_blank" rel="noreferrer">공개 페이지<ArrowUpRight size={15} /></Link></div><p className="admin-note">{current?.updatedAt ? `최근 저장: ${date(current.updatedAt)}` : "기본 문서를 사용하고 있습니다."}</p><label>문서 내용<textarea required rows={16} maxLength={5000} value={content} disabled={busy} onChange={event => setContent(event.target.value)} /></label><span className="admin-character-count">{content.length.toLocaleString()} / 5,000{changed && " · 저장하지 않음"}</span><div className="admin-form-actions"><button type="submit" className="admin-primary" disabled={busy || !changed || !content.trim()}><Save size={16} />{busy ? "저장 중…" : "가이드 저장"}</button>{changed && <button type="button" disabled={busy} onClick={() => setContent(current?.content || "")}>변경 취소</button>}</div></form></div> : !error && <p className="admin-state" role="status">가이드를 불러오는 중…</p>}
  </>;
}
