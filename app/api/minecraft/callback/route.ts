import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { minecraftLinkAttempts, minecraftProfiles } from "../../../../db/schema";
import { accountRedirect, clearStateCookie, cookieName, fetchMinecraftProfile, microsoftConfig } from "../shared";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  const cookie = request.headers.get("cookie")?.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1);
  const result = (status: string) => new Response(null, { status: 303, headers: { location: accountRedirect(status).href, "set-cookie": clearStateCookie, "cache-control": "no-store" } });
  if (!state || !/^[a-f\d]{64}$/.test(state) || cookie !== state) {
    return result("invalid_state");
  }
  // The state is single-use and bound to the Supabase user who started the flow.
  const [attempt] = await getDb().delete(minecraftLinkAttempts).where(eq(minecraftLinkAttempts.state, state)).returning();
  let status = "invalid_state";
  const config = microsoftConfig();
  if (attempt && Date.now() - attempt.createdAt.getTime() <= 600000 && code && code.length < 4096 && config) {
    try {
      const profile = await fetchMinecraftProfile(code, attempt.verifier, config);
      await getDb().insert(minecraftProfiles).values({ userId: attempt.userId, ...profile, capes: JSON.stringify(profile.capes), connectedAt: new Date() })
        .onConflictDoUpdate({ target: minecraftProfiles.userId, set: { ...profile, capes: JSON.stringify(profile.capes), connectedAt: new Date() } });
      status = "connected";
    } catch (error) {
      console.error("Minecraft connection callback failed",{kind:error instanceof Error ? error.name : "unknown"});
      status = error instanceof Error && ["microsoft_app_credentials", "microsoft_token_failed", "xbox_login_failed", "xbox_permission_failed", "minecraft_app_not_approved", "minecraft_auth_denied", "minecraft_profile_denied", "minecraft_no_java_profile", "minecraft_network_denied", "minecraft_transport_failed", "minecraft_relay_not_configured"].includes(error.message) ? error.message : "failed";
    }
  }
  if(status === "invalid_state")console.error("Minecraft callback prerequisites failed",{hasAttempt:Boolean(attempt),hasCode:Boolean(code),codeLength:code?.length,configured:Boolean(config),ageMs:attempt ? Date.now()-attempt.createdAt.getTime() : null});
  return result(status);
}
