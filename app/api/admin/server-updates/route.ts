import { eq } from "drizzle-orm";
import { getSupabaseUser } from "../../../supabase-server";
import { getStaffRole } from "@/db/forum";
import { getDb } from "@/db";
import { serverUpdates } from "@/db/schema";
import { listServerUpdates } from "@/db/portal";
import { PortalError, portalFailure, portalResponse, readPortalJson, updateSchema } from "@/lib/portal-model";
import { z } from "zod";
async function staff(request: Request) {
  const user = await getSupabaseUser(request);
  if (!user) throw new PortalError(401, "로그인이 필요합니다.");
  if (await getStaffRole(user) === "member") throw new PortalError(403, "운영 권한이 필요합니다.");
  return user;
}
export async function GET(request: Request) {
  try { await staff(request); return portalResponse({ updates: await listServerUpdates(true) }); } catch (error) { return portalFailure(error); }
}
export async function POST(request: Request) {
  try { const user = await staff(request); const body = updateSchema.parse(await readPortalJson(request, 65536)); const now = new Date(); const [entry] = await getDb().insert(serverUpdates).values({ ...body, authorId: user.userId, createdAt: now, updatedAt: now }).returning({ id: serverUpdates.id }); return portalResponse(entry, 201); } catch (error) { return portalFailure(error); }
}
export async function PATCH(request: Request) {
  try { await staff(request); const body = updateSchema.extend({ id: z.number().int().positive() }).parse(await readPortalJson(request, 65536)); const { id, ...values } = body; const [entry] = await getDb().update(serverUpdates).set({ ...values, updatedAt: new Date() }).where(eq(serverUpdates.id, id)).returning({ id: serverUpdates.id }); if (!entry) throw new PortalError(404, "소식이 없습니다."); return portalResponse(entry); } catch (error) { return portalFailure(error); }
}
export async function DELETE(request: Request) {
  try { await staff(request); const { id } = z.object({ id: z.number().int().positive() }).parse(await readPortalJson(request, 65536)); await getDb().delete(serverUpdates).where(eq(serverUpdates.id, id)); return portalResponse({ deleted: true }); } catch (error) { return portalFailure(error); }
}
