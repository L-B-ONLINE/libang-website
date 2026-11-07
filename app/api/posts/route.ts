import { getSupabaseUser } from "../../supabase-server";
import { getStaffRole, createPost, type ForumCategory } from "../../../db/forum";
const categories = new Set<ForumCategory>(["notice", "free", "question", "development", "gaming", "daily"]);
export async function POST(request: Request) {
  const user = await getSupabaseUser(request);
  if (!user) return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
  let body: { category?: unknown; title?: unknown; content?: unknown };
  try { body = await request.json(); } catch { return Response.json({ error: "잘못된 요청입니다." }, { status: 400 }); }
  const category = typeof body.category === "string" ? body.category : "";
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const content = typeof body.content === "string" ? body.content.trim() : "";
  if (!categories.has(category as ForumCategory) || !title || !content) return Response.json({ error: "주제, 제목, 내용을 모두 입력하세요." }, { status: 400 });
  if (title.length > 120 || content.length > 10000) return Response.json({ error: "글이 허용된 길이를 초과했습니다." }, { status: 400 });
  const isAdmin = await getStaffRole(user) !== "member";
  if (category === "notice" && !isAdmin) return Response.json({ error: "공지는 관리자만 작성할 수 있습니다." }, { status: 403 });
  return Response.json(await createPost({ category: category as ForumCategory, title, content, user }), { status: 201 });
}
