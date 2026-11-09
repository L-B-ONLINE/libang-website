import { redeemPairCode } from "@/db/portal";
import { readPortalJson, portalFailure, portalResponse } from "@/lib/portal-model";
import { z } from "zod";
export async function POST(request: Request) {
  try { const { code } = z.object({ code: z.string().max(64) }).parse(await readPortalJson(request)); return portalResponse(await redeemPairCode(code)); } catch (error) { return portalFailure(error); }
}
