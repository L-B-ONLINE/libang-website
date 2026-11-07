"use client";
import Link from "@/components/site-link";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Pencil } from "@/components/site-icons";
import { useAuth } from "../auth-provider";
import type { GuideKey } from "../../db/guide";
import CopyAddress from "../copy-address";
import PageFrame from "../page-frame";

const sections: { id: GuideKey; title: string; group: string }[] = [
  { id: "connect", title: "서버 접속 방법", group: "시작하기" },
  { id: "commands", title: "기본 명령어", group: "시작하기" },
  { id: "dongwon", title: "Dongwon 시작하기", group: "서버별 가이드" },
  { id: "lokawar", title: "Bose 시작하기", group: "서버별 가이드" },
  { id: "reability", title: "ReAbility 시작하기", group: "서버별 가이드" },
  { id: "rules", title: "이용 규칙", group: "도움말" },
  { id: "faq", title: "자주 묻는 질문", group: "도움말" },
];
const groups = ["시작하기", "서버별 가이드", "도움말"];

function GuideText({ text, connect }: { text: string; connect: boolean }) {
  const [edition, setEdition] = useState<"java" | "bedrock">("java");
  const lines = text.split("\n");
  const java = lines.find(line => /^Java 에디션[:：]/.test(line));
  const bedrock = lines.find(line => /^베드락 에디션[:：]/.test(line));
  if (connect && java && bedrock) {
    const instructions = (edition === "java" ? java : bedrock).replace(/^[^:：]+[:：]\s*/, "").split("→");
    return <><div className="edition-tabs" role="group" aria-label="마인크래프트 에디션"><button type="button" aria-pressed={edition === "java"} onClick={() => setEdition("java")}>Java Edition</button><button type="button" aria-pressed={edition === "bedrock"} onClick={() => setEdition("bedrock")}>Bedrock Edition</button></div><ol className="connection-steps">{instructions.map((step, index) => <li key={index}><span>{index + 1}</span><p>{step.trim()}</p></li>)}</ol>{lines.filter(line => line !== java && line !== bedrock && line.trim()).map((line, index) => <p className="guide-note" key={index}>{line}</p>)}</>;
  }
  return <div className="guide-prose">{text.split(/\n\s*\n/).filter(Boolean).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>;
}

export default function GuideClient({ initialContent }: { initialContent: Record<GuideKey, string> }) {
  const { session } = useAuth();
  const [content, setContent] = useState(initialContent);
  const [active, setActive] = useState<GuideKey>("connect");
  const [editing, setEditing] = useState<GuideKey | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [staff, setStaff] = useState<{ token: string; value: boolean } | null>(null);
  const admin = Boolean(session && staff?.token === session.access_token && staff.value);
  const position = sections.findIndex(section => section.id === active);
  const current = sections[position];

  useEffect(() => {
    const sync = () => {
      const hash = window.location.hash.slice(1);
      const key = hash === "bose" ? "lokawar" : hash;
      setActive(sections.some(section => section.id === key) ? key as GuideKey : "connect");
      setEditing(null);
      setError("");
    };
    sync();
    window.addEventListener("hashchange", sync);
    window.addEventListener("popstate", sync);
    return () => { window.removeEventListener("hashchange", sync); window.removeEventListener("popstate", sync); };
  }, []);
  useEffect(() => {
    const token = session?.access_token;
    if (!token) return;
    let alive = true;
    void fetch("/api/auth/me", { headers: { authorization: `Bearer ${token}` } })
      .then(async response => response.ok ? await response.json() as { isAdmin?: boolean } : null)
      .then(data => { if (alive) setStaff({ token, value: Boolean(data?.isAdmin) }); })
      .catch(() => { if (alive) setStaff({ token, value: false }); });
    return () => { alive = false; };
  }, [session?.access_token]);

  function choose(key: GuideKey) {
    if (busy) return;
    if (editing && draft.trim() !== content[editing].trim() && !window.confirm("저장하지 않은 변경을 취소하고 이동할까요?")) return;
    setEditing(null); setError(""); setActive(key);
    window.history.pushState(null, "", `/guide#${key === "lokawar" ? "bose" : key}`);
  }
  async function save() {
    if (!session || !editing || busy) return;
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/guide/${editing}`, { method: "PUT", headers: { "content-type": "application/json", authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ content: draft }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "저장하지 못했습니다.");
      setContent(value => ({ ...value, [editing]: draft.trim() })); setEditing(null);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "저장하지 못했습니다."); }
    finally { setBusy(false); }
  }

  return <PageFrame title="가이드" className="guide-page" actions={<Link href="/forum?category=question" className="text-link">포럼에서 질문하기 <ArrowRight size={17} /></Link>}>
    <div className="guide-layout"><aside className="guide-navigation"><nav aria-label="가이드 문서">{groups.map(group => <div className="guide-nav-group" key={group}><span>{group}</span>{sections.filter(section => section.group === group).map(section => <button key={section.id} type="button" aria-current={active === section.id ? "page" : undefined} onClick={() => choose(section.id)}>{section.title}</button>)}</div>)}</nav></aside>
      <div className="guide-mobile-select"><BookOpen size={18} /><label className="sr-only" htmlFor="guide-document">가이드 문서 선택</label><select id="guide-document" value={active} disabled={busy} onChange={event => choose(event.target.value as GuideKey)}>{groups.map(group => <optgroup label={group} key={group}>{sections.filter(section => section.group === group).map(section => <option value={section.id} key={section.id}>{section.title}</option>)}</optgroup>)}</select></div>
      <div className="guide-reading"><article aria-labelledby="guide-article-title"><div className="reading-header"><h2 id="guide-article-title">{current.title}</h2>{admin && !editing && <button type="button" className="guide-edit" onClick={() => { setEditing(active); setDraft(content[active]); setError(""); }}><Pencil size={14} />수정</button>}</div>
        {active === "connect" && <div className="guide-address"><div><span>서버 주소</span><strong>libang.online</strong></div><CopyAddress /></div>}
        {editing === active ? <form className="guide-editor" onSubmit={event => { event.preventDefault(); void save(); }}><label htmlFor="guide-draft">가이드 내용</label><textarea id="guide-draft" value={draft} required maxLength={5000} onChange={event => setDraft(event.target.value)} />{error && <p className="form-error" role="alert">{error}</p>}<div className="guide-editor-actions"><button type="button" disabled={busy} onClick={() => setEditing(null)}>취소</button><button type="submit" disabled={busy || !draft.trim()}>{busy ? "저장 중…" : "변경 저장"}</button></div></form> : <GuideText key={active} text={content[active]} connect={active === "connect"} />}

        {current.group === "서버별 가이드" && <Link className="article-link" href={`/servers/${active === "lokawar" ? "bose" : active}`}>서버 정보 보기 <ArrowRight size={16} /></Link>}
      </article><nav className="document-pagination" aria-label="다른 가이드">{position > 0 ? <button type="button" disabled={busy} onClick={() => choose(sections[position - 1].id)}><ArrowLeft size={16} /><span><small>이전 문서</small>{sections[position - 1].title}</span></button> : <span />}{position < sections.length - 1 && <button type="button" disabled={busy} onClick={() => choose(sections[position + 1].id)}><span><small>다음 문서</small>{sections[position + 1].title}</span><ArrowRight size={16} /></button>}</nav></div>
    </div>
  </PageFrame>;
}
