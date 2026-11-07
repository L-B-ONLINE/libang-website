"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../auth-provider";

type Category = "notice" | "free" | "question" | "development" | "gaming" | "daily";
export default function PostActions({ id, authorId, initialCategory, initialTitle, initialContent }: { id: number; authorId: string; initialCategory: Category; initialTitle: string; initialContent: string }) {
  const { session } = useAuth();
  const router = useRouter();
  const [adminState, setAdminState] = useState<{ token: string; isAdmin: boolean } | null>(null);
  const [editing, setEditing] = useState(false);
  const [category, setCategory] = useState(initialCategory);
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!session?.access_token) return;
    const token = session.access_token;
    let active = true;
    void fetch("/api/auth/me", { headers: { authorization: `Bearer ${token}` } })
      .then(async (response) => {
        if (!response.ok) throw new Error("관리자 권한을 확인하지 못했습니다.");
        return response.json() as Promise<{ isAdmin?: boolean }>;
      })
      .then((data) => { if (active) setAdminState({ token, isAdmin: Boolean(data.isAdmin) }); })
      .catch(() => { /* The server still checks permission when an action is used. */ });
    return () => { active = false; };
  }, [session?.access_token]);
  if (!session) return null;
  const roleChecked = adminState?.token === session.access_token;
  const isAdmin = roleChecked && adminState.isAdmin;
  if (session.user.id !== authorId && !isAdmin) return null;
  const headers = { authorization: `Bearer ${session.access_token}` };
  async function save() {
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/posts/${id}`, { method: "PATCH", headers: { ...headers, "content-type": "application/json" }, body: JSON.stringify({ category, title, content }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "수정하지 못했습니다.");
      setEditing(false); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "수정하지 못했습니다."); }
    finally { setBusy(false); }
  }
  async function remove() {
    if (!window.confirm("이 글을 삭제할까요?")) return;
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/posts/${id}`, { method: "DELETE", headers });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "삭제하지 못했습니다.");
      router.push("/forum"); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "삭제하지 못했습니다."); }
    finally { setBusy(false); }
  }
  return <div className="post-actions">
    {editing ? <form className="composer-edit" onSubmit={(event) => { event.preventDefault(); void save(); }}>
      <label>주제<select value={category} onChange={(event) => setCategory(event.target.value as Category)}>{isAdmin && <option value="notice">공지</option>}<option value="free">자유</option><option value="question">질문</option><option value="development">개발</option><option value="gaming">게임</option><option value="daily">일상</option></select></label>
      <label>제목<input required maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} /></label>
      <label>내용<textarea required maxLength={10000} value={content} onChange={(event) => setContent(event.target.value)} /></label>
      <button type="submit" disabled={busy}>저장</button><button type="button" onClick={() => setEditing(false)}>취소</button>
    </form> : <><button type="button" onClick={() => setEditing(true)}>수정</button><button type="button" disabled={busy} onClick={() => void remove()}>삭제</button></>}
    {error && <p role="alert" className="form-error">{error}</p>}
  </div>;
}
