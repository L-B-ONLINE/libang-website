import { servers } from "@/lib/servers";
import { guideDefaults, getGuideContent, guideKeys } from "@/db/guide";
import { listPosts } from "@/db/forum";
import { listServerUpdates } from "@/db/portal";
import { loadMinecraftCatalog } from "@/lib/minecraft-data";
import type { SearchEntry } from "@/lib/search-model";
const guideNames = { connect: "서버 접속 방법", commands: "기본 명령어", dongwon: "Dongwon 시작하기", lokawar: "Bose 시작하기", reability: "ReAbility 시작하기", rules: "이용 규칙", faq: "자주 묻는 질문" };
export async function GET() {
  const [guides, posts, catalog, updates] = await Promise.allSettled([getGuideContent(), listPosts(), loadMinecraftCatalog(), listServerUpdates()]);
  const content = guides.status === "fulfilled" ? guides.value : guideDefaults;
  const entries: SearchEntry[] = [
    ...servers.map(server => ({ id: `server:${server.slug}`, kind: "server" as const, title: server.name, description: server.description, href: `/servers/${server.slug}`, keywords: `${server.genre} ${server.tags.join(" ")} ${server.slug === "dongwon" ? "동원" : ""}` })),
    { id: "server:roadmap", kind: "server", title: "동원 로드맵", description: "Dongwon SMP → 평화 야생 → RPG", href: "/servers/dongwon/roadmap", keywords: "동원 로드맵 개발 계획 RPG" },
    { id: "server:updates", kind: "server", title: "리뱅 서버 소식", description: "업데이트 · 개발 현황 · 점검 안내", href: "/servers/updates" },
    ...guideKeys.map(key => ({ id: `guide:${key}`, kind: "guide" as const, title: guideNames[key], description: content[key].slice(0, 180), keywords: content[key].slice(0, 4000), href: `/guide#${key === "lokawar" ? "bose" : key}` })),
  ];
  if (posts.status === "fulfilled") entries.push(...posts.value.map(post => ({ id: `post:${post.id}`, kind: "post" as const, title: post.title, description: post.content.replace(/\s+/g, " ").slice(0, 180), href: `/forum/${post.id}`, keywords: post.category })));
  if (catalog.status === "fulfilled") entries.push(...catalog.value.versions.map(version => ({ id: `version:${version.id}`, kind: "version" as const, title: [version.id, version.updateName].filter(Boolean).join(" "), description: `Java Edition · ${version.type === "release" ? "정식 버전" : version.type === "snapshot" ? "테스트 버전" : "초기 개발 버전"}`, href: `/minecraft/versions/${encodeURIComponent(version.id)}`, keywords: version.type })));
  if (updates.status === "fulfilled") entries.push(...updates.value.map(update => ({ id: `update:${update.id}`, kind: "update" as const, title: update.title, description: update.content.replace(/\s+/g, " ").slice(0, 180), href: `/servers/updates#update-${update.id}`, keywords: update.serverSlug })));
  const partial = posts.status === "rejected" || guides.status === "rejected" || catalog.status === "rejected" || catalog.status === "fulfilled" && !catalog.value.versionsAvailable;
  return Response.json({ entries, partial }, { headers: { "Cache-Control": "public, max-age=60, s-maxage=300", "X-Content-Type-Options": "nosniff" } });
}
