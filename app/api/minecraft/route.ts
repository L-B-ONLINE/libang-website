import { eq, lt } from "drizzle-orm";
import { getDb } from "../../../db";
import { minecraftLinkAttempts, minecraftProfiles, siteSettings } from "../../../db/schema";
import { getSupabaseUser } from "../../supabase-server";
import { codeChallenge, cookieName, microsoftConfig, randomToken, redirectUri } from "./shared";

export async function GET(request: Request) {
  const user = await getSupabaseUser(request);
  if (!user) return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
  const [profile] = await getDb().select().from(minecraftProfiles).where(eq(minecraftProfiles.userId, user.userId)).limit(1);
  return Response.json({ configured: Boolean(microsoftConfig()), profile: profile ? {
    uuid: profile.uuid, name: profile.name, skinUrl: profile.skinUrl, skinVariant: profile.skinVariant,
    capes: JSON.parse(profile.capes) as unknown, connectedAt: profile.connectedAt.toISOString(),
  } : null }, { headers: { "cache-control": "no-store" } });
}

export async function POST(request: Request) {
  const user = await getSupabaseUser(request);
  if (!user) return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
  const config = microsoftConfig();
  if (!config) return Response.json({ error: "Microsoft 앱 등록 정보를 설정해야 합니다." }, { status: 503 });
  const state = randomToken();
  const verifier = randomToken();
  const db = getDb();
  await db.delete(minecraftLinkAttempts).where(lt(minecraftLinkAttempts.createdAt, new Date(Date.now() - 600000)));
  await db.insert(minecraftLinkAttempts).values({ state, verifier, userId: user.userId, createdAt: new Date() });
  const url = new URL("https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize");
  url.search = new URLSearchParams({ client_id: config.clientId, response_type: "code", redirect_uri: redirectUri,
    response_mode: "query", scope: "XboxLive.signin", state, code_challenge: await codeChallenge(verifier), code_challenge_method: "S256", prompt: "select_account",
  }).toString();
  return Response.json({ url: url.href }, { headers: { "cache-control": "no-store", "set-cookie": `${cookieName}=${state}; Path=/api/minecraft/callback; HttpOnly; Secure; SameSite=Lax; Max-Age=600` } });
}

export async function DELETE(request: Request) {
  const user = await getSupabaseUser(request);
  if (!user) return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
  await getDb().delete(minecraftLinkAttempts).where(eq(minecraftLinkAttempts.userId,user.userId));
  await getDb().delete(minecraftProfiles).where(eq(minecraftProfiles.userId, user.userId));
  await getDb().delete(siteSettings).where(eq(siteSettings.key,"player_display:"+user.userId));
  return Response.json({ ok: true });
}
