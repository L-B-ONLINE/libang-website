import { env } from "cloudflare:workers";
import { minecraftRelayRequest } from "../../../lib/minecraft-relay";

const origin = "https://web.libang.online";
export const redirectUri = `${origin}/api/minecraft/callback`;
export const cookieName = "minecraft_link_state";
export const clearStateCookie = `${cookieName}=; Path=/api/minecraft/callback; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;

export function microsoftConfig() {
  const values = env as unknown as { MICROSOFT_CLIENT_ID?: string; MICROSOFT_CLIENT_SECRET?: string };
  const clientId = values.MICROSOFT_CLIENT_ID?.trim();
  const clientSecret = values.MICROSOFT_CLIENT_SECRET?.trim();
  return clientId && clientSecret ? { clientId, clientSecret } : null;
}

export function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function codeChallenge(verifier: string) {
  const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier)));
  return btoa(String.fromCharCode(...hash)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function accountRedirect(result: string) {
  return new URL(`/profile?minecraft=${encodeURIComponent(result)}`, origin);
}

type MinecraftProfile = { id: string; name: string; skins?: { url?: string; variant?: string; state?: string }[]; capes?: { id?: string; alias?: string; url?: string; state?: string }[] };

async function jsonRequest<T>(url: string, init: RequestInit): Promise<T> {
  const values=env as unknown as { MINECRAFT_API_USE_SUPABASE?:string;SUPABASE_URL?:string;SUPABASE_SERVICE_ROLE_KEY?:string };
  const relay=minecraftRelayRequest(url,init,{enabled:values.MINECRAFT_API_USE_SUPABASE === "true",supabaseUrl:values.SUPABASE_URL?.trim(),serviceRoleKey:values.SUPABASE_SERVICE_ROLE_KEY?.trim()});
  const response = await fetch(relay?.url ?? url, { ...(relay?.init ?? init),redirect:"manual",signal: AbortSignal.timeout(15000) });
  if(response.status>=300 && response.status<400)throw new Error("minecraft_transport_failed");
  if (!response.ok) {
    const stage=new URL(url).hostname === "login.microsoftonline.com" ? "microsoft_token" : new URL(url).hostname === "user.auth.xboxlive.com" ? "xbox_login" : new URL(url).hostname === "xsts.auth.xboxlive.com" ? "xbox_permission" : "minecraft";
    const diagnostic=await response.clone().json().catch(()=>null) as {error_codes?:number[];XErr?:number;error?:string}|null;
    console.error("Minecraft connection stage failed",{stage,status:response.status,relay:Boolean(relay),codes:diagnostic?.error_codes?.filter(x=>typeof x === "number").slice(0,5),xboxCode:typeof diagnostic?.XErr === "number" ? diagnostic.XErr : undefined});
    if(stage === "microsoft_token")throw new Error(diagnostic?.error === "invalid_client" ? "microsoft_app_credentials" : "microsoft_token_failed");
    if(stage === "xbox_login")throw new Error("xbox_login_failed");
    if(stage === "xbox_permission")throw new Error("xbox_permission_failed");
    if(new URL(url).hostname === "api.minecraftservices.com") {
      const isJson=response.headers.get("content-type")?.includes("application/json");
      if(!isJson)throw new Error("minecraft_network_denied");
      const error=await response.clone().json().catch(()=>null) as {error?:string}|null;
      if(error?.error && ["minecraft_network_denied","minecraft_transport_failed","minecraft_app_not_approved","minecraft_no_java_profile"].includes(error.error))throw new Error(error.error);
      if(relay && error?.error !== "minecraft_upstream_rejected" && [401,404].includes(response.status) && new URL(url).pathname !== "/minecraft/profile")throw new Error("minecraft_relay_not_configured");
      if(response.status===404 && new URL(url).pathname === "/minecraft/profile")throw new Error("minecraft_no_java_profile");
    }
    if (response.status === 403 && url.includes("minecraftservices.com/")) {
      const path = new URL(url).pathname;
      const body = await response.text().catch(() => "");
      const invalidRegistration = path === "/authentication/login_with_xbox" && /invalid app registration/i.test(body);
      let upstreamMessage = "unavailable";
      try {
        const parsed = JSON.parse(body) as { errorMessage?: unknown; error?: unknown };
        const value = typeof parsed.errorMessage === "string" ? parsed.errorMessage : parsed.error;
        if (typeof value === "string") {
          // Upstream error text can be useful, but never log tokens, email addresses, or arbitrary bodies.
          upstreamMessage = /@|token|secret|bearer|[a-f\d]{32}/i.test(value)
            ? "redacted" : value.slice(0, 160);
        }
      } catch { /* A non-JSON response is still identified by status and content type. */ }
      console.warn("Minecraft API rejected request", {
        path, status: response.status, invalidRegistration, upstreamMessage,
        contentType: response.headers.get("content-type")?.slice(0, 60) ?? "unknown",
      });
      if (invalidRegistration) {
        throw new Error("minecraft_app_not_approved");
      }
      throw new Error(path === "/minecraft/profile" ? "minecraft_profile_denied" : "minecraft_auth_denied");
    }
    throw new Error("minecraft_auth_failed");
  }
  return response.json() as Promise<T>;
}

function safeTextureUrl(url: string | undefined) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "textures.minecraft.net" || !["http:", "https:"].includes(parsed.protocol)) return null;
    parsed.protocol = "https:";
    return parsed.href;
  } catch { return null; }
}

export async function fetchMinecraftProfile(code: string, verifier: string, config: { clientId: string; clientSecret: string }) {
  const tokens = await jsonRequest<{ access_token?: string }>("https://login.microsoftonline.com/consumers/oauth2/v2.0/token", {
    method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: config.clientId, client_secret: config.clientSecret, code, redirect_uri: redirectUri, grant_type: "authorization_code", code_verifier: verifier }),
  });
  if (!tokens.access_token) throw new Error("minecraft_auth_failed");
  const xbox = await jsonRequest<{ Token?: string }>("https://user.auth.xboxlive.com/user/authenticate", {
    method: "POST", headers: { "content-type": "application/json", "x-xbl-contract-version": "1" },
    body: JSON.stringify({ RelyingParty: "http://auth.xboxlive.com", TokenType: "JWT", Properties: { AuthMethod: "RPS", SiteName: "user.auth.xboxlive.com", RpsTicket: `d=${tokens.access_token}` } }),
  });
  if (!xbox.Token) throw new Error("minecraft_auth_failed");
  const xsts = await jsonRequest<{ Token?: string; DisplayClaims?: { xui?: { uhs?: string }[] } }>("https://xsts.auth.xboxlive.com/xsts/authorize", {
    method: "POST", headers: { "content-type": "application/json", "x-xbl-contract-version": "1" },
    body: JSON.stringify({ Properties: { SandboxId: "RETAIL", UserTokens: [xbox.Token] }, RelyingParty: "rp://api.minecraftservices.com/", TokenType: "JWT" }),
  });
  const hash = xsts.DisplayClaims?.xui?.[0]?.uhs;
  if (!xsts.Token || !hash) throw new Error("minecraft_auth_failed");
  const game = await jsonRequest<{ access_token?: string }>("https://api.minecraftservices.com/authentication/login_with_xbox", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ identityToken: `XBL3.0 x=${hash};${xsts.Token}` }),
  });
  if (!game.access_token) throw new Error("minecraft_auth_failed");
  const profile = await jsonRequest<MinecraftProfile>("https://api.minecraftservices.com/minecraft/profile", {
    headers: { authorization: `Bearer ${game.access_token}` },
  });
  if (!/^[a-f\d]{32}$/i.test(profile.id) || !/^[\w]{3,16}$/.test(profile.name)) throw new Error("minecraft_no_java_profile");
  const skin = profile.skins?.find((entry) => entry.state === "ACTIVE") ?? profile.skins?.[0];
  return {
    uuid: profile.id, name: profile.name,
    skinUrl: safeTextureUrl(skin?.url), skinVariant: skin?.variant === "SLIM" ? "SLIM" : "CLASSIC",
    capes: (profile.capes ?? []).slice(0, 50).map((cape) => ({ id: cape.id ?? "", name: cape.alias ?? "망토", url: safeTextureUrl(cape.url), active: cape.state === "ACTIVE" })),
  };
}
