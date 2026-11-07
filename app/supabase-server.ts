import { createClient } from "@supabase/supabase-js";
import { env } from "cloudflare:workers";
import type { ChatGPTUser } from "./chatgpt-auth";

export function getSupabaseConfig() {
  const url = env.SUPABASE_URL?.trim();
  const anonKey = env.SUPABASE_ANON_KEY?.trim();
  return url && anonKey ? { url, anonKey } : null;
}

export function getSupabaseAdminClient() {
  const config = getSupabaseConfig();
  const secret = (env as unknown as { SUPABASE_SERVICE_ROLE_KEY?: string }).SUPABASE_SERVICE_ROLE_KEY?.trim();
  return config && secret ? createClient(config.url, secret, { auth: { persistSession: false, autoRefreshToken: false } }) : null;
}

export async function getSupabaseUser(request: Request): Promise<ChatGPTUser | null> {
  const token = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  const config = getSupabaseConfig();
  if (!token || !config) return null;
  const client = createClient(config.url, config.anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user?.email) return null;
  const name = typeof data.user.user_metadata?.full_name === "string" ? data.user.user_metadata.full_name : null;
  return { userId: data.user.id, email: data.user.email, fullName: name, displayName: name ?? data.user.email };
}
