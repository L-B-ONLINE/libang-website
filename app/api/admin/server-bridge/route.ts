import { getSupabaseUser } from "../../../supabase-server";
import { getStaffRole } from "@/db/forum";
import { bridgeOverview, issuePairCode, revokeBridge } from "@/db/portal";
import { PortalError, portalFailure, portalResponse, readPortalJson, serverSlugSchema } from "@/lib/portal-model";
import { z } from "zod";
async function owner(request: Request) {
  const user = await getSupabaseUser(request);
  if (!user) throw new PortalError(401, "로그인이 필요합니다.");
  if (await getStaffRole(user) !== "owner") throw new PortalError(403, "서버 연동은 관리자만 설정할 수 있습니다.");
  return user;
}
export async function GET(request: Request) {
  try { await owner(request); return portalResponse({ connections: await bridgeOverview() }); } catch (error) { return portalFailure(error); }
}
export async function POST(request: Request) {
  try { const user = await owner(request); const { serverSlug } = z.object({ serverSlug: serverSlugSchema }).parse(await readPortalJson(request)); return portalResponse(await issuePairCode(serverSlug, user.userId)); } catch (error) { return portalFailure(error); }
}
export async function DELETE(request: Request) {
  try { await owner(request); const { serverSlug } = z.object({ serverSlug: serverSlugSchema }).parse(await readPortalJson(request)); await revokeBridge(serverSlug); return portalResponse({ revoked: true }); } catch (error) { return portalFailure(error); }
}
