import { listServerUpdates } from "@/db/portal";
import { portalFailure } from "@/lib/portal-model";
export async function GET() {
  try { return Response.json({ updates: await listServerUpdates() }, { headers: { "Cache-Control": "public, max-age=30, s-maxage=30" } }); } catch (error) { return portalFailure(error); }
}
