import { getSupabaseUser } from "../../supabase-server";
import { bookmarkSchema, PortalError, portalFailure, portalResponse, readPortalJson } from "@/lib/portal-model";
import { listSaved, removeBookmark, saveBookmark } from "@/db/portal";

async function user(request: Request) {
  const user = await getSupabaseUser(request);
  if (!user) throw new PortalError(401, "로그인하면 보관함을 사용할 수 있습니다.");
  return user;
}
export async function GET(request: Request) {
  try { const current = await user(request); return portalResponse({ entries: await listSaved(current.userId) }); } catch (error) { return portalFailure(error); }
}
export async function PUT(request: Request) {
  try { const current = await user(request); const input = bookmarkSchema.parse(await readPortalJson(request)); return portalResponse({ entry: await saveBookmark(current.userId, input.kind, input.resourceId) }); } catch (error) { return portalFailure(error); }
}
export async function DELETE(request: Request) {
  try { const current = await user(request); const input = bookmarkSchema.parse(await readPortalJson(request)); await removeBookmark(current.userId, input.kind, input.resourceId); return portalResponse({ deleted: true }); } catch (error) { return portalFailure(error); }
}
