import { listPosts } from "../../db/forum";
import ForumClient from "./forum-client";
import PageFrame from "../page-frame";

export const dynamic = "force-dynamic";
export default async function ForumPage({ searchParams }: { searchParams: Promise<{ category?: string; q?: string }> }) {
  const { category, q } = await searchParams;
  const initialFilter = category === "notice" || category === "free" || category === "question" || category === "development" || category === "gaming" || category === "daily" ? category : "all";
  let posts: Awaited<ReturnType<typeof listPosts>> = [];
  let unavailable = false;
  try { posts = await listPosts(); } catch { unavailable = true; }
  return <PageFrame title="포럼" className="forum-page">
      <ForumClient unavailable={unavailable} posts={posts.map((post) => ({ ...post, createdAt: post.createdAt.toISOString(), updatedAt: post.updatedAt?.toISOString() ?? null }))} signedIn={false} isAdmin={false} signInPath="/login" initialFilter={initialFilter} initialQuery={q?.slice(0, 200) ?? ""} />
  </PageFrame>;
}
