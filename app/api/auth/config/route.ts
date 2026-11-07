import { getSupabaseConfig } from "../../../supabase-server";
export const dynamic = "force-dynamic";
export async function GET() {
  const config = getSupabaseConfig();
  return config ? Response.json(config) : Response.json({ error: "Supabase가 아직 연결되지 않았습니다." }, { status: 503 });
}
