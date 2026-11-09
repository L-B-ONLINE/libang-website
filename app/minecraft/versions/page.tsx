import type { Metadata } from "next";
import PageFrame from "../../page-frame";
import { loadMinecraftCatalog } from "@/lib/minecraft-data";
import VersionLibrary from "./version-library";
import CatalogStatus from "../catalog-status";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "마인크래프트 버전 라이브러리 | L.B ONLINE", description: "Java Edition 정식 버전, 스냅샷, 프리릴리스와 알파·베타 버전을 검색하고 공식 서버 파일을 확인하세요." };

export default async function VersionsPage() {
  const catalog = await loadMinecraftCatalog();
  return <PageFrame title="버전 라이브러리" className="minecraft-page">
    <header className="mc-intro mc-intro-compact"><span className="mc-eyebrow">MINECRAFT / VERSION ARCHIVE</span><h2>블록으로 쌓아 온 시간.</h2><p>Java Edition 공식 배포 기록을 검색하세요. 버전을 선택하면 출시일, Java 요구 버전과 공식 서버 파일을 확인할 수 있습니다.</p></header>
    {catalog.versionsAvailable ? <VersionLibrary versions={catalog.versions} latest={catalog.latest}/> : <CatalogStatus>공식 버전 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</CatalogStatus>}
    <p className="mc-source-note mc-bottom-note">출처: Mojang 공식 Java Edition 배포 목록 · 최대 30분 간격 갱신. 테스트 버전은 월드에 영향을 줄 수 있으니 기존 월드를 백업한 뒤 이용하세요.</p>
  </PageFrame>;
}
