import { and, desc, eq, sql } from "drizzle-orm";
import { getD1, getDb } from ".";
import { bookmarks, serverCredentials, serverHeartbeats, serverPairCodes, serverUpdates } from "./schema";
import { getPost } from "./forum";
import { guideKeys } from "./guide";
import { loadMinecraftCatalog } from "../lib/minecraft-data";
import { PortalError, hashSecret, randomSecret, equalDigests, type BookmarkKind } from "../lib/portal-model";

const guideNames: Record<string, string> = { connect: "서버 접속 방법", commands: "기본 명령어", dongwon: "Dongwon 시작하기", lokawar: "Bose 시작하기", reability: "ReAbility 시작하기", rules: "이용 규칙", faq: "자주 묻는 질문" };

export async function listSaved(userId: string) {
  const rows = await getDb().select({ kind: bookmarks.kind, resourceId: bookmarks.resourceId, title: bookmarks.title, href: bookmarks.href, createdAt: bookmarks.createdAt }).from(bookmarks).where(eq(bookmarks.userId, userId)).orderBy(desc(bookmarks.createdAt)).limit(500);
  return rows.map(row => ({ ...row, createdAt: row.createdAt.toISOString() }));
}

export async function canonicalBookmark(kind: BookmarkKind, resourceId: string) {
  if (kind === "post") {
    if (!/^[1-9]\d{0,9}$/.test(resourceId)) throw new PortalError(400, "게시글을 확인하세요.");
    const post = await getPost(Number(resourceId));
    if (!post) throw new PortalError(404, "게시글이 없습니다.");
    return { kind, resourceId, title: post.title, href: `/forum/${post.id}` };
  }
  if (kind === "guide") {
    const key = resourceId === "bose" ? "lokawar" : resourceId;
    if (!guideKeys.some(value => value === key)) throw new PortalError(404, "가이드가 없습니다.");
    return { kind, resourceId: key, title: guideNames[key], href: `/guide#${key === "lokawar" ? "bose" : key}` };
  }
  if (!/^[a-zA-Z0-9._-]{1,100}$/.test(resourceId)) throw new PortalError(400, "버전을 확인하세요.");
  const catalog = await loadMinecraftCatalog();
  if (!catalog.versionsAvailable) throw new PortalError(503, "공식 버전 목록을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.");
  const version = catalog.versions.find(version => version.id === resourceId);
  if (!version) throw new PortalError(404, "버전이 없습니다.");
  return { kind, resourceId, title: [version.id, version.updateName].filter(Boolean).join(" "), href: `/minecraft/versions/${encodeURIComponent(version.id)}` };
}

export async function saveBookmark(userId: string, kind: BookmarkKind, resourceId: string) {
  const entry = await canonicalBookmark(kind, resourceId);
  // The insert itself enforces the per-user cap, including concurrent requests.
  const now = Date.now();
  const result = await getD1().prepare("INSERT INTO bookmarks(user_id,kind,resource_id,title,href,created_at) SELECT ?,?,?,?,?,? WHERE (SELECT COUNT(*) FROM bookmarks WHERE user_id=?)<500 OR EXISTS(SELECT 1 FROM bookmarks WHERE user_id=? AND kind=? AND resource_id=?) ON CONFLICT(user_id,kind,resource_id) DO UPDATE SET title=excluded.title,href=excluded.href RETURNING created_at")
    .bind(userId, entry.kind, entry.resourceId, entry.title, entry.href, now, userId, userId, entry.kind, entry.resourceId).first<{ created_at: number }>();
  if (!result) throw new PortalError(409, "보관함은 최대 500개까지 저장할 수 있습니다.");
  return { ...entry, createdAt: new Date(result.created_at).toISOString() };
}

export async function removeBookmark(userId: string, kind: BookmarkKind, resourceId: string) {
  const key = kind === "guide" && resourceId === "bose" ? "lokawar" : resourceId;
  await getDb().delete(bookmarks).where(and(eq(bookmarks.userId, userId), eq(bookmarks.kind, kind), eq(bookmarks.resourceId, key)));
}

export async function listServerUpdates(includeDrafts = false) {
  const rows = await getDb().select({ id: serverUpdates.id, serverSlug: serverUpdates.serverSlug, category: serverUpdates.category, title: serverUpdates.title, content: serverUpdates.content, published: serverUpdates.published, createdAt: serverUpdates.createdAt, updatedAt: serverUpdates.updatedAt }).from(serverUpdates).where(includeDrafts ? undefined : eq(serverUpdates.published, true)).orderBy(desc(serverUpdates.createdAt), desc(serverUpdates.id)).limit(200);
  return rows.map(row => ({ ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() }));
}

export async function bridgeOverview() {
  const db = getDb();
  const [credentials, heartbeats, codes] = await Promise.all([
    db.select({ serverSlug: serverCredentials.serverSlug, createdAt: serverCredentials.createdAt }).from(serverCredentials),
    db.select().from(serverHeartbeats),
    db.select({ serverSlug: serverPairCodes.serverSlug, expiresAt: serverPairCodes.expiresAt }).from(serverPairCodes),
  ]);
  return credentials.map(credential => ({ serverSlug: credential.serverSlug, connectedAt: credential.createdAt.toISOString(), lastSeen: heartbeats.find(row => row.serverSlug === credential.serverSlug)?.updatedAt.toISOString() ?? null, pendingPair: codes.find(row => row.serverSlug === credential.serverSlug)?.expiresAt.toISOString() ?? null }));
}

export async function issuePairCode(serverSlug: string, userId: string) {
  const code = `LB-${randomSecret(20)}`;
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  const codeHash = await hashSecret(code);
  await getDb().insert(serverPairCodes).values({ serverSlug, codeHash, requestedBy: userId, expiresAt }).onConflictDoUpdate({ target: serverPairCodes.serverSlug, set: { codeHash, requestedBy: userId, expiresAt } });
  return { code, serverSlug, expiresAt: expiresAt.toISOString(), command: `libangbridge pair ${code}` };
}

export async function redeemPairCode(code: string) {
  if (!/^LB-[a-f0-9]{40}$/.test(code)) throw new PortalError(401, "연결 코드가 올바르지 않거나 만료되었습니다.");
  const id = crypto.randomUUID();
  const token = `lb_${id}.${randomSecret(32)}`;
  const codeHash = await hashSecret(code); const tokenHash = await hashSecret(token); const now = Date.now();
  const db = getD1();
  const results = await db.batch([
    db.prepare("INSERT INTO server_credentials(id,server_slug,token_hash,created_at) SELECT ?,server_slug,?,? FROM server_pair_codes WHERE code_hash=? AND expires_at>? ON CONFLICT(server_slug) DO UPDATE SET id=excluded.id,token_hash=excluded.token_hash,created_at=excluded.created_at RETURNING server_slug").bind(id, tokenHash, now, codeHash, now),
    db.prepare("DELETE FROM server_pair_codes WHERE code_hash=? AND expires_at>?").bind(codeHash, now),
    db.prepare("DELETE FROM server_heartbeats WHERE server_slug IN(SELECT server_slug FROM server_credentials WHERE id=?)").bind(id),
  ]);
  const slug = (results[0].results[0] as { server_slug: string } | undefined)?.server_slug;
  if (!slug) throw new PortalError(401, "연결 코드가 올바르지 않거나 만료되었습니다.");
  return { serverSlug: slug, token, heartbeatIntervalSeconds: 30 };
}

export async function authenticateBridge(request: Request) {
  const token = request.headers.get("authorization")?.match(/^Bearer (lb_([a-f0-9-]{36})\.[a-f0-9]{64})$/i);
  if (!token) throw new PortalError(401, "서버 인증이 필요합니다.");
  const [credential] = await getDb().select().from(serverCredentials).where(eq(serverCredentials.id, token[2])).limit(1);
  const digest = await hashSecret(token[1]);
  if (!credential || !equalDigests(credential.tokenHash, digest)) throw new PortalError(401, "서버 인증에 실패했습니다.");
  return credential;
}

export async function revokeBridge(serverSlug: string) {
  const db = getD1();
  await db.batch([
    db.prepare("DELETE FROM server_credentials WHERE server_slug=?").bind(serverSlug),
    db.prepare("DELETE FROM server_pair_codes WHERE server_slug=?").bind(serverSlug),
    db.prepare("DELETE FROM server_heartbeats WHERE server_slug=?").bind(serverSlug),
  ]);
}

export async function getHeartbeatRows() {
  return getDb().select({ serverSlug: serverHeartbeats.serverSlug, state: serverHeartbeats.state, playersOnline: serverHeartbeats.playersOnline, playersMax: serverHeartbeats.playersMax, gameVersion: serverHeartbeats.gameVersion, supportedVersions: serverHeartbeats.supportedVersions, software: serverHeartbeats.software, updatedAt: serverHeartbeats.updatedAt }).from(serverHeartbeats)
    .innerJoin(serverCredentials, and(eq(serverHeartbeats.credentialId, serverCredentials.id), eq(serverHeartbeats.serverSlug, serverCredentials.serverSlug)));
}

export async function totalSaved(userId: string) {
  const [row] = await getDb().select({ count: sql<number>`count(*)` }).from(bookmarks).where(eq(bookmarks.userId, userId));
  return row.count;
}
