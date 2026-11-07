"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogPortal, DialogTitle } from "@/components/ui/dialog";
import { Dialog as DialogPrimitive } from "radix-ui";
import { ArrowLeft, ArrowRight, Pencil, Pin, Search, X } from "@/components/site-icons";
import { useAuth } from "../auth-provider";

import {ArrowDownWideNarrow,ArrowUpNarrowWide} from "lucide-react";
import { PlayerName } from "../player-identity";
type Category = "notice" | "free" | "question" | "development" | "gaming" | "daily";
type Post = { id: number; category: Category; title: string; content: string; authorName: string; authorId: string; createdAt: string; updatedAt: string | null };
const labels: Record<Category, string> = { notice: "공지", free: "자유", question: "질문", development: "개발", gaming: "게임", daily: "일상" };

export default function ForumClient({ posts, signedIn, isAdmin, signInPath, initialFilter, initialQuery = "", unavailable = false }: { posts: Post[]; signedIn: boolean; isAdmin: boolean; signInPath: string; initialFilter: "all" | Category; initialQuery?: string; unavailable?: boolean }) {
  const router = useRouter();
  const { session } = useAuth();
  const [adminState, setAdminState] = useState<{ token: string; isAdmin: boolean } | null>(null);
  const [filter, setFilter] = useState<"all" | Category>(initialFilter);
  const [query, setQuery] = useState(initialQuery);
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const tabsRef = useRef<HTMLDivElement>(null);
  const [tabIndicator, setTabIndicator] = useState<{ left: number; width: number } | null>(null);
  const [open, setOpen] = useState(false);
  const [penTilt, setPenTilt] = useState(false);
  const penTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [category, setCategory] = useState<Category>(isAdmin ? "notice" : "free");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!session?.access_token) return;
    const token = session.access_token;
    void fetch("/api/auth/me", { headers: { authorization: `Bearer ${session.access_token}` } })
      .then(async (response) => response.ok ? await response.json() as { isAdmin?: boolean } : null)
      .then((data: { isAdmin?: boolean } | null) => setAdminState({ token, isAdmin: Boolean(data?.isAdmin) }))
      .catch(() => setAdminState({ token, isAdmin: false }));
  }, [session?.access_token]);
  const effectiveSignedIn = Boolean(session) || signedIn;
  const effectiveAdmin = Boolean(adminState && adminState.token === session?.access_token && adminState.isAdmin) || isAdmin;
  const pinnedId = posts.find(post => post.category === "notice")?.id;
  const visible = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return posts.filter(post => (filter === "all" || post.category === filter) && (!needle || `${post.title} ${post.content} ${post.authorName}`.toLocaleLowerCase().includes(needle)))
      .sort((a, b) => {
        if (a.id === pinnedId) return -1;
        if (b.id === pinnedId) return 1;
        const dateOrder = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() || b.id - a.id;
        return sort === "oldest" ? -dateOrder : dateOrder;
      });
  }, [filter, posts, query, sort, pinnedId]);
  const totalPages = Math.max(1, Math.ceil(visible.length / 12));
  const currentPage = Math.min(page, totalPages);
  const pagePosts = visible.slice((currentPage - 1) * 12, currentPage * 12);
  useEffect(() => {
    if (window.location.pathname !== "/forum") return;
    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      if (filter !== "all") params.set("category", filter);
      if (query.trim()) params.set("q", query.trim());
      window.history.replaceState(null, "", `/forum${params.size ? `?${params}` : ""}`);
    }, 200);
    return () => clearTimeout(timer);
  }, [query, filter]);

  useEffect(() => {
    const tabs = tabsRef.current;
    if (!tabs) return;
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const selected = tabs.querySelector<HTMLButtonElement>('button[aria-pressed="true"]');
        if (selected) setTabIndicator({ left: selected.offsetLeft, width: selected.offsetWidth });
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(tabs);
    window.addEventListener("resize", measure);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); window.removeEventListener("resize", measure); };
  }, [filter]);
  useEffect(() => () => penTimers.current.forEach(clearTimeout), []);

  function openComposer() {
    if (penTilt) return;
    setPenTilt(true);
    penTimers.current.forEach(clearTimeout);
    penTimers.current = [setTimeout(() => setOpen(true), 145), setTimeout(() => setPenTilt(false), 370)];
  }

  async function submit() {
    if (!title.trim() || !content.trim() || sending) return;
    setSending(true); setError("");
    try {
      const response = await fetch("/api/posts", { method: "POST", headers: { "content-type": "application/json", ...(session?.access_token ? { authorization: `Bearer ${session.access_token}` } : {}) }, body: JSON.stringify({ category: category === "notice" && !effectiveAdmin ? "free" : category, title, content }) });
      const result = await response.json() as { id?: number; error?: string };
      if (!response.ok || !result.id) throw new Error(result.error || "게시하지 못했습니다.");
      setOpen(false); setTitle(""); setContent("");
      router.push(`/forum/${result.id}`); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "게시하지 못했습니다."); }
    finally { setSending(false); }
  }

  return <>
    <div className="forum-title-actions">{effectiveSignedIn ? <button type="button" className="btn btn-primary" onClick={openComposer}><Pencil size={18}/>글쓰기</button> : <a className="btn btn-primary" href={signInPath}><Pencil size={18}/>글쓰기</a>}</div>
    <div className="topic-tabs" role="group" aria-label="포럼 주제" ref={tabsRef}>
      {(["all", "notice", "free", "question", "development", "gaming", "daily"] as const).map((item) => <button aria-pressed={filter === item} className={filter === item ? "active" : ""} key={item} onClick={() => { setFilter(item); setPage(1); }} type="button">{item === "all" ? "전체" : labels[item]}</button>)}
      {tabIndicator && <span aria-hidden="true" className="topic-indicator" style={{ width: tabIndicator.width, transform: `translateX(${tabIndicator.left}px)` }} />}
    </div>
    <div className="forum-toolbar"><label className="forum-search"><Search size={17} /><span className="sr-only">제목, 내용, 작성자 검색</span><input type="search" value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} placeholder="제목, 내용, 작성자 검색" />{query && <button type="button" aria-label="검색어 지우기" onClick={() => { setQuery(""); setPage(1); }}><X size={16} /></button>}</label><div className="forum-sort"><span role="status">{visible.length}개의 글</span><button className="forum-sort-icon" type="button" aria-label={sort === "newest" ? "최신순, 오래된순으로 변경" : "오래된순, 최신순으로 변경"} title={sort === "newest" ? "최신순" : "오래된순"} onClick={()=>{setSort(sort === "newest" ? "oldest" : "newest");setPage(1);}}>{sort === "newest" ? <ArrowDownWideNarrow size={18}/> : <ArrowUpNarrowWide size={18}/>}</button></div></div>
    <section className="post-list">
      {pagePosts.length ? pagePosts.map((post) => <a className={`post-row${post.id === pinnedId ? " pinned" : ""}`} href={`/forum/${post.id}`} key={post.id}>
        <span className={`category category-${post.category}`}>{labels[post.category]}</span>
        <span className="post-copy"><strong>{post.id === pinnedId && <><Pin size={14} aria-hidden="true" /><span className="sr-only">고정 공지: </span></>}{post.title}</strong><span>{post.content}</span></span>
        <span className="post-meta"><PlayerName userId={post.authorId} name={post.authorName}/><span className="post-date">{new Date(post.createdAt).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })}{post.updatedAt && <> · 수정됨</>}</span></span>
      </a>) : <div className="empty">{unavailable ? "글을 불러오지 못했습니다. 잠시 후 다시 확인해주세요." : query ? "검색 결과가 없습니다." : "아직 작성된 글이 없습니다."}{unavailable && <button type="button" onClick={() => router.refresh()}>다시 불러오기</button>}{query && <button type="button" onClick={() => { setQuery(""); setPage(1); }}>검색 초기화</button>}</div>}
    </section>
    {totalPages > 1 && <nav className="forum-pagination" aria-label="포럼 페이지"><button type="button" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}><ArrowLeft size={15} />이전</button><span>{currentPage} / {totalPages}</span><button type="button" disabled={currentPage >= totalPages} onClick={() => setPage(currentPage + 1)}>다음<ArrowRight size={15} /></button></nav>}
    {effectiveSignedIn
      ? <button className={`compose-fab${penTilt ? " pen-tilt" : ""}`} type="button" aria-label="글 작성" onClick={openComposer}><Pencil aria-hidden="true" /></button>
      : <a className="compose-fab" href={signInPath} target="_top" aria-label="로그인하고 글 작성"><Pencil aria-hidden="true" /></a>}
    <Dialog open={open} onOpenChange={(value) => { if (!sending) setOpen(value); }}><DialogPortal>
      <DialogPrimitive.Overlay className="composer-overlay" />
      <DialogPrimitive.Content className="composer" aria-describedby={undefined}>
        <form onSubmit={(event) => { event.preventDefault(); void submit(); }}>
        <div className="composer-head"><DialogTitle>글 작성</DialogTitle><button type="button" disabled={sending} onClick={() => setOpen(false)}>취소</button></div>
        <label>주제<select value={category === "notice" && !effectiveAdmin ? "free" : category} onChange={(event) => setCategory(event.target.value as Category)}>{effectiveAdmin && <option value="notice">공지</option>}<option value="free">자유</option><option value="question">질문</option><option value="development">개발</option><option value="gaming">게임</option><option value="daily">일상</option></select></label>
        <label>제목<input value={title} maxLength={120} onChange={(event) => setTitle(event.target.value)} placeholder="제목을 입력하세요" /></label>
        <label>내용<textarea value={content} maxLength={10000} onChange={(event) => setContent(event.target.value)} placeholder="내용을 입력하세요" /></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="publish" type="submit" disabled={!title.trim() || !content.trim() || sending}>{sending ? "게시 중…" : "게시"}</button>
        </form>
      </DialogPrimitive.Content>
    </DialogPortal></Dialog>
  </>;
}
