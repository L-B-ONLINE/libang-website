import type { Metadata } from "next";
import Link from "@/components/site-link";
import { ArrowRight, ArrowUpRight } from "@/components/site-icons";
import PageFrame from "../page-frame";
import { loadMinecraftCatalog } from "@/lib/minecraft-data";
import { minecraftDate } from "@/lib/minecraft-catalog";
import CatalogStatus from "./catalog-status";
import NewsList from "./news-list";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "마인크래프트 업데이트 | L.B ONLINE", description: "Mojang 공식 Java Edition 업데이트 소식과 마인크래프트 버전 라이브러리." };

export default async function MinecraftPage() {
  const catalog = await loadMinecraftCatalog();
  const release = catalog.versions.find(version => version.id === catalog.latest?.release);
  const snapshot = catalog.versions.find(version => version.id === catalog.latest?.snapshot);
  return <PageFrame title="마인크래프트" className="minecraft-page" actions={<Link className="text-link" href="/minecraft/versions">버전 라이브러리 <ArrowRight size={17}/></Link>}>
    <header className="mc-intro"><span className="mc-eyebrow">MINECRAFT / JAVA EDITION</span><h2>새로운 모험의 다음 장.</h2><p>공식 업데이트 소식부터 지나온 버전까지, 한곳에서 둘러보세요.</p></header>
    {catalog.latest ? <section className="mc-latest-grid" aria-label="최신 마인크래프트 버전">
      {[{ version: release, label: "최신 정식 버전", type: "release", description: "안정적으로 플레이할 정식 출시 버전." }, { version: snapshot, label: "최신 테스트 버전", type: "snapshot", description: "다음 업데이트를 먼저 만나는 실험 버전." }].map(item => item.version && <Link className={`mc-latest mc-latest-${item.type}`} href={`/minecraft/versions/${encodeURIComponent(item.version.id)}`} key={item.type}>
        <div><span className={`mc-badge mc-badge-${item.type}`}>{item.label}</span><ArrowUpRight size={21}/></div><h3>{item.version.id}</h3><p>{item.description}</p><time dateTime={item.version.releaseTime}>{minecraftDate(item.version.releaseTime)} 공개</time>
      </Link>)}
    </section> : <CatalogStatus>최신 버전 정보를 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.</CatalogStatus>}
    <section className="mc-news-section" aria-labelledby="mc-news-title"><div className="section-heading"><h2 id="mc-news-title">업데이트 소식</h2><a className="text-link" href="https://www.minecraft.net/en-us/updates" target="_blank" rel="noopener noreferrer">Minecraft 공식 소식 <ArrowUpRight size={17}/></a></div>
      <p className="mc-source-note">Mojang 공식 런처의 Java Edition 소식입니다. 요약과 패치 노트 원문은 영어로 제공됩니다.</p>
      {catalog.newsAvailable ? <NewsList news={catalog.news}/> : <CatalogStatus>업데이트 소식을 불러오지 못했습니다. 잠시 후 다시 확인하거나 공식 소식 페이지를 이용해 주세요.</CatalogStatus>}
    </section>
    <aside className="mc-edition-note"><div><h2>Bedrock Edition 소식이 궁금하다면</h2><p>Bedrock 정식 업데이트와 Preview 소식은 Minecraft 공식 페이지에서 확인하세요.</p></div><a className="text-link" href="https://www.minecraft.net/en-us/updates" target="_blank" rel="noopener noreferrer">공식 업데이트 보기 <ArrowUpRight size={17}/></a></aside>
    <p className="mc-source-note mc-bottom-note">출처: Mojang 공식 런처 · 공식 배포 목록. 최대 30분 간격으로 갱신됩니다. 게임 최신 버전과 리뱅 서버의 접속 가능 버전은 다를 수 있습니다.</p>
  </PageFrame>;
}
