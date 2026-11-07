import { and, count, desc, eq, or, sql } from "drizzle-orm";
import { getDb } from "../../../db";
import { getStaffRole } from "../../../db/forum";
import { guideDefaults, guideKeys } from "../../../db/guide";
import { guideSections, posts, siteSettings, subadmins } from "../../../db/schema";
import { getSupabaseAdminClient, getSupabaseUser } from "../../supabase-server";

const privateHeaders = { "cache-control": "private, no-store" };
const json = (value: unknown, status = 200) => Response.json(value, { status, headers: privateHeaders });

export async function GET(request: Request) {
  const user = await getSupabaseUser(request);
  if (!user) return json({ error: "로그인이 필요합니다." }, 401);
  if (await getStaffRole(user) !== "owner") return json({ error: "관리자 권한이 필요합니다." }, 403);
  const url = new URL(request.url);
  const section = url.searchParams.get("section") || "accounts";
  const page = Math.max(1, Math.min(1000, Math.floor(Number(url.searchParams.get("page")) || 1)));
  const db = getDb();
  try {
    if (section === "posts") {
      const query = (url.searchParams.get("q") || "").trim().slice(0, 100).toLowerCase();
      const category = url.searchParams.get("category");
      const where = and(
        category === "notice" || category === "free" || category === "question" || category === "development" || category === "gaming" || category === "daily" ? eq(posts.category, category) : undefined,
        query ? or(sql`instr(lower(${posts.title}), ${query}) > 0`, sql`instr(lower(${posts.content}), ${query}) > 0`, sql`instr(lower(${posts.authorName}), ${query}) > 0`) : undefined,
      );
      const [totals, items] = await Promise.all([
        db.select({ value: count() }).from(posts).where(where),
        db.select().from(posts).where(where).orderBy(desc(posts.createdAt), desc(posts.id)).limit(20).offset((page - 1) * 20),
      ]);
      return json({ posts: items, total: totals[0].value, page, perPage: 20 });
    }
    if (section === "guides") {
      const rows = await db.select().from(guideSections);
      return json({ guides: guideKeys.map(key => {
        const saved = rows.find(row => row.key === key);
        return { key, content: saved?.content ?? guideDefaults[key], updatedAt: saved?.updatedAt ?? null, customized: Boolean(saved) };
      }) });
    }
    const admin = getSupabaseAdminClient();
    if (section === "overview") {
      const [counts, staff, guides, recentPosts, accounts] = await Promise.all([
        db.select({ total: count(), notices: sql<number>`coalesce(sum(case when ${posts.category} = 'notice' then 1 else 0 end), 0)`, questions: sql<number>`coalesce(sum(case when ${posts.category} = 'question' then 1 else 0 end), 0)` }).from(posts),
        db.select({ value: count() }).from(subadmins),
        db.select({ value: count() }).from(guideSections),
        db.select().from(posts).orderBy(desc(posts.createdAt), desc(posts.id)).limit(5),
        admin ? admin.auth.admin.listUsers({ page: 1, perPage: 1 }).catch(() => null) : Promise.resolve(null),
      ]);
      return json({ totalUsers: accounts && !accounts.error ? accounts.data.total : null, totalPosts: counts[0].total, notices: Number(counts[0].notices), questions: Number(counts[0].questions), staffCount: staff[0].value + 1, customizedGuides: guides[0].value, recentPosts });
    }
    if (section !== "accounts") return json({ error: "지원하지 않는 관리 항목입니다." }, 400);
    if (!admin) return json({ error: "계정 관리를 사용하려면 SUPABASE_SERVICE_ROLE_KEY를 설정해야 합니다." }, 503);
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 50 });
    if (error) return json({ error: "계정 목록을 불러오지 못했습니다." }, 502);
    const staff = await db.select().from(subadmins);
    const staffIds = new Set(staff.map(entry => entry.userId));
    return json({ users: data.users.map(entry => ({
      id: entry.id, email: entry.email || "",
      name: String(entry.user_metadata?.username || entry.user_metadata?.full_name || ""),
      role: entry.id === user.userId ? "owner" : staffIds.has(entry.id) ? "subadmin" : "member",
      createdAt: entry.created_at, lastSignInAt: entry.last_sign_in_at || null,
      confirmed: Boolean(entry.email_confirmed_at),
      providers: (entry.identities || []).map(identity => identity.provider),
    })), page, total: data.total, hasMore: page * 50 < data.total });
  } catch {
    return json({ error: "관리 정보를 불러오지 못했습니다. 잠시 후 다시 시도하세요." }, 502);
  }
}

export async function PATCH(request: Request) {
  const user = await getSupabaseUser(request);
  if (!user) return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
  if (await getStaffRole(user) !== "owner") return Response.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
  const admin = getSupabaseAdminClient();
  if (!admin) return Response.json({ error: "서버 비밀 키가 필요합니다." }, { status: 503 });
  let input: { id?: string; action?: string; email?: string; name?: string };
  try { input = await request.json(); } catch { return Response.json({ error: "잘못된 요청입니다." }, { status: 400 }); }
  if (!input.id || typeof input.id !== "string") return Response.json({ error: "계정을 선택하세요." }, { status: 400 });
  const { data: existing, error: lookupError } = await admin.auth.admin.getUserById(input.id);
  if (lookupError || !existing.user) return Response.json({ error: "계정을 찾을 수 없습니다." }, { status: 404 });
  if (input.action === "subadmin") {
    if (input.id === user.userId) return Response.json({ error: "관리자는 부관리자로 지정할 수 없습니다." }, { status: 400 });
    await getDb().insert(subadmins).values({ userId: input.id, email: existing.user.email || "" }).onConflictDoUpdate({ target: subadmins.userId, set: { email: existing.user.email || "" } });
  } else if (input.action === "removeSubadmin") {
    await getDb().delete(subadmins).where(eq(subadmins.userId, input.id));
  } else if (input.action === "transfer") {
    if (input.id === user.userId) return Response.json({ error: "이미 관리자 계정입니다." }, { status: 400 });
    if (!existing.user.email_confirmed_at) return Response.json({ error: "이메일 인증을 완료한 계정으로만 관리자 권한을 이전할 수 있습니다." }, { status: 400 });
    // Compare the current owner in the write to avoid an outdated owner changing it.
    const changed = await getDb().update(siteSettings).set({ value: input.id }).where(and(eq(siteSettings.key, "primary_admin_user_id"), eq(siteSettings.value, user.userId))).returning();
    if (!changed.length) return Response.json({ error: "관리자를 변경하지 못했습니다." }, { status: 409 });
    await getDb().delete(subadmins).where(eq(subadmins.userId, input.id));
  } else if (input.action === "update") {
    const email = typeof input.email === "string" ? input.email.trim() : "";
    const name = typeof input.name === "string" ? input.name.trim() : "";
    if (!email.includes("@") || email.length > 254 || name.length < 2 || name.length > 40) return Response.json({ error: "이메일과 이름을 확인하세요." }, { status: 400 });
    const { error } = await admin.auth.admin.updateUserById(input.id, { email, user_metadata: { ...existing.user.user_metadata, username: name, full_name: name } });
    if (error) return Response.json({ error: error.message }, { status: 400 });
    await getDb().update(posts).set({ authorName: name }).where(eq(posts.authorId, input.id));
    await getDb().update(subadmins).set({ email }).where(eq(subadmins.userId, input.id));
  } else if (input.action === "resetPassword") {
    if (!existing.user.email) return Response.json({ error: "이메일이 없는 계정입니다." }, { status: 400 });
    const { error } = await admin.auth.resetPasswordForEmail(existing.user.email, { redirectTo: "https://web.libang.online/account" });
    if (error) return Response.json({ error: "재설정 메일을 보내지 못했습니다." }, { status: 502 });
  } else return Response.json({ error: "지원하지 않는 작업입니다." }, { status: 400 });
  return Response.json({ ok: true });
}
