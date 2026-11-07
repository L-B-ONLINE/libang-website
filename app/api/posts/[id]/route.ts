import { getSupabaseUser } from "../../../supabase-server";
import { getStaffRole, deletePost, getPost, updatePost, type ForumCategory } from "../../../../db/forum";

async function authorize(request: Request, id: number) {
  const user = await getSupabaseUser(request);
  if (!user) return { error: Response.json({ error: "로그인이 필요합니다." }, { status: 401 }) };
  const post = await getPost(id);
  if (!post) return { error: Response.json({ error: "글을 찾을 수 없습니다." }, { status: 404 }) };
  const isAdmin = await getStaffRole(user) !== "member";
  if (post.authorId !== user.userId && !isAdmin) return { error: Response.json({ error: "수정 권한이 없습니다." }, { status: 403 }) };
  return { post, isAdmin };
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) return Response.json({ error: "잘못된 글 번호입니다." }, { status: 400 });
  const access = await authorize(request, id);
  if (access.error) return access.error;
  let body: { category?: unknown; title?: unknown; content?: unknown };
  try { body = await request.json(); } catch { return Response.json({ error: "잘못된 요청입니다." }, { status: 400 }); }
  const category = body.category;
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const content = typeof body.content === "string" ? body.content.trim() : "";
  if (category !== "notice" && category !== "free" && category !== "question" && category !== "development" && category !== "gaming" && category !== "daily" || !title || !content || title.length > 120 || content.length > 10000) return Response.json({ error: "주제, 제목, 내용을 확인하세요." }, { status: 400 });
  if (category === "notice" && !access.isAdmin) return Response.json({ error: "공지는 관리자만 작성할 수 있습니다." }, { status: 403 });
  await updatePost(id, { category: category as ForumCategory, title, content });
  return Response.json({ ok: true });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) return Response.json({ error: "잘못된 글 번호입니다." }, { status: 400 });
  const access = await authorize(request, id);
  if (access.error) return access.error;
  await deletePost(id);
  return Response.json({ ok: true });
}
