declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
    SUPABASE_URL?: string;
    SUPABASE_ANON_KEY?: string;
    SUPABASE_SERVICE_ROLE_KEY?: string;
    MICROSOFT_CLIENT_ID?: string;
    MICROSOFT_CLIENT_SECRET?: string;
    MINECRAFT_API_USE_SUPABASE?: string;
  }
}
