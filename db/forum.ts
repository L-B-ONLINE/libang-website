import { desc, eq } from "drizzle-orm";
import type { ChatGPTUser as AuthUser } from "../app/chatgpt-auth";
import { getDb } from ".";
import { posts, siteSettings, subadmins } from "./schema";

export type ForumCategory = "notice" | "free" | "question" | "development" | "gaming" | "daily";
const ADMIN_KEY = "primary_admin_user_id";
const INITIAL_ADMIN_EMAIL = "geunyanggecko@gmail.com";

export async function getStaffRole(user: AuthUser): Promise<"owner" | "subadmin" | "member"> {
  const db = getDb();
  if (user.email.toLowerCase() === INITIAL_ADMIN_EMAIL) {
    await db.insert(siteSettings).values({ key: ADMIN_KEY, value: user.userId }).onConflictDoNothing();
  }
  const [setting] = await db.select({ value: siteSettings.value }).from(siteSettings)
    .where(eq(siteSettings.key, ADMIN_KEY)).limit(1);
  if (setting?.value === user.userId) return "owner";
  const [staff] = await db.select({ userId: subadmins.userId }).from(subadmins).where(eq(subadmins.userId, user.userId)).limit(1);
  return staff ? "subadmin" : "member";
}

export async function listPosts() {
  const db = getDb();
  const [latestNotice] = await db.select().from(posts).where(eq(posts.category, "notice")).orderBy(desc(posts.createdAt), desc(posts.id)).limit(1);
  const recent = await db.select().from(posts).orderBy(desc(posts.createdAt), desc(posts.id)).limit(100);
  return latestNotice ? [latestNotice, ...recent.filter((post) => post.id !== latestNotice.id)].slice(0, 100) : recent;
}

export async function getPost(id: number) {
  const [post] = await getDb().select().from(posts).where(eq(posts.id, id)).limit(1);
  return post ?? null;
}

export async function createPost(input: { category: ForumCategory; title: string; content: string; user: AuthUser }) {
  const [post] = await getDb().insert(posts).values({
    category: input.category, title: input.title, content: input.content,
    authorId: input.user.userId, authorName: input.user.displayName, createdAt: new Date(),
  }).returning({ id: posts.id });
  return post;
}

export async function updatePost(id: number, input: { category: ForumCategory; title: string; content: string }) {
  await getDb().update(posts).set({ ...input, updatedAt: new Date() }).where(eq(posts.id, id));
}

export async function deletePost(id: number) {
  await getDb().delete(posts).where(eq(posts.id, id));
}
