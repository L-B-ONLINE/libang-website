import { loadServerStatus } from "@/lib/server-status";
export async function GET() {
  return Response.json(await loadServerStatus(), { headers: { "Cache-Control": "public, max-age=15, s-maxage=15", "X-Content-Type-Options": "nosniff" } });
}
