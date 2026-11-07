import { getSupabaseUser } from "../../../supabase-server";
import { getStaffRole } from "../../../../db/forum";
import { guideKeys, setGuideContent, type GuideKey } from "../../../../db/guide";

export async function PUT(request: Request, { params }: { params: Promise<{ key: string }> }) {
  const key = (await params).key;
  if (!guideKeys.includes(key as GuideKey)) return Response.json({ error: "가이드 항목을 찾을 수 없습니다." }, { status: 404 });
  const user = await getSupabaseUser(request);
  if (!user) return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
  if (await getStaffRole(user) === "member") return Response.json({ error: "관리자만 가이드를 수정할 수 있습니다." }, { status: 403 });
  let body: { content?: unknown };
  try { body = await request.json(); } catch { return Response.json({ error: "잘못된 요청입니다." }, { status: 400 }); }
  const content = typeof body.content === "string" ? body.content.trim() : "";
  if (!content || content.length > 5000) return Response.json({ error: "내용을 1~5000자로 입력하세요." }, { status: 400 });
  await setGuideContent(key as GuideKey, content);
  return Response.json({ ok: true });
}
