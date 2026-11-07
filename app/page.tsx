import { listPosts } from "../db/forum";
import HomeExperience from "./home-experience";

export const dynamic = "force-dynamic";
export default async function Home() {
  let posts: Awaited<ReturnType<typeof listPosts>> = [];
  let unavailable = false;
  try { posts = (await listPosts()).slice(0, 4); } catch { unavailable = true; }
  return <HomeExperience posts={posts.map(post => ({ id: post.id, title: post.title, category: post.category, createdAt: post.createdAt.toISOString() }))} unavailable={unavailable} />;
}
