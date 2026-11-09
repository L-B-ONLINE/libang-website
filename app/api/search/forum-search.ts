import { and, desc, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { posts } from "@/db/schema";
import { searchExcerpt, searchTokens, type SearchEntry } from "@/lib/search-model";

export async function searchForum(query: string): Promise<SearchEntry[]> {
  const tokens = searchTokens(query);
  // instr treats %, _ and backslashes literally. Every token must occur in the title or full body.
  const matching = tokens.map(token => sql`instr(lower(${posts.title} || ' ' || ${posts.content}), ${token}) > 0`);
  const titleScore = tokens.length ? sql<number>`(${sql.join(tokens.map(token => sql`CASE WHEN instr(lower(${posts.title}), ${token}) > 0 THEN 1 ELSE 0 END`), sql` + `)})` : sql<number>`0`;
  const rows = await getDb().select({ id: posts.id, title: posts.title, content: posts.content }).from(posts).where(tokens.length ? and(...matching) : undefined).orderBy(...(tokens.length ? [desc(titleScore)] : []), desc(posts.createdAt), desc(posts.id)).limit(30);
  return rows.map(post => ({ id: `post:${post.id}`, kind: "post", title: post.title, description: searchExcerpt(post.content, query), href: `/forum/${post.id}` }));
}
