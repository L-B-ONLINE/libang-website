import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "@/components/site-link";
import { ArrowLeft, ArrowUpRight } from "@/components/site-icons";
import PageFrame from "../../../page-frame";
import { loadMinecraftVersion } from "@/lib/minecraft-data";
import { channelLabels, channelDescriptions, minecraftDate, versionChannel } from "@/lib/minecraft-catalog";
import CatalogStatus from "../../catalog-status";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Minecraft 버전 정보 | L.B ONLINE" };

export default async function VersionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[a-zA-Z0-9._-]{1,100}$/.test(id)) notFound();
  let data: Awaited<ReturnType<typeof loadMinecraftVersion>>;
  try { data = await loadMinecraftVersion(id); } catch {
    return <PageFrame title="버전 정보" className="minecraft-page"><CatalogStatus>공식 버전 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</CatalogStatus><Link className="text-link" href="/minecraft/versions"><ArrowLeft size={17}/>버전 목록</Link></PageFrame>;
  }
  if (!data) notFound();
  const { version, download } = data;
  const channel = versionChannel(version);
  return <PageFrame title={[version.id, version.updateName].filter(Boolean).join(" ")} className="minecraft-page" actions={<Link className="text-link" href="/minecraft/versions"><ArrowLeft size={17}/>버전 목록</Link>}>
    {version.image && <img className="mc-version-hero" src={version.image.url} alt={version.image.alt} width={960} height={540} fetchPriority="high" decoding="async"/>}
    <header className="mc-version-intro"><span className="mc-eyebrow">MINECRAFT / JAVA EDITION</span><div><span className={`mc-badge mc-badge-${channel}`}>{channelLabels[channel]}</span>{id === data.latestRelease && <span className="mc-latest-label">최신 정식 버전</span>}</div><p>Java Edition 공식 배포 정보</p></header>
    <div className="mc-channel-explanation"><h2>{channelLabels[channel]}</h2><p>{channelDescriptions[channel]}</p></div>
    <div className="mc-detail-grid"><section className="mc-version-facts" aria-labelledby="mc-version-facts"><h2 id="mc-version-facts">버전 정보</h2><dl><div><dt>버전</dt><dd>{version.id}</dd></div><div><dt>에디션</dt><dd>Java Edition</dd></div><div><dt>공개일</dt><dd><time dateTime={version.releaseTime}>{minecraftDate(version.releaseTime)}</time></dd></div><div><dt>분류</dt><dd>{channelLabels[channel]}</dd></div><div><dt>Java 요구 버전</dt><dd>{data.javaVersion ? `Java ${data.javaVersion}` : "공식 배포 정보에 미표기"}</dd></div></dl><a className="text-link" href={data.source} target="_blank" rel="noopener noreferrer">Mojang 공식 배포 정보 <ArrowUpRight size={16}/></a></section>
      <aside className="mc-download-panel"><h2>공식 서버 파일</h2>{download ? <><p>Mojang이 배포한 이 버전의 바닐라 서버 파일입니다.</p><a className="btn btn-primary" href={download.url}>server.jar 다운로드 <ArrowUpRight size={18}/></a><span className="mc-file-size">{(download.size / 1024 / 1024).toFixed(1)} MB</span><details className="mc-checksum"><summary>파일 검증용 SHA-1</summary><code>{download.sha1}</code></details><p className="mc-source-note">실행 전 <a href="https://www.minecraft.net/en-us/eula" target="_blank" rel="noopener noreferrer">Minecraft EULA</a>를 확인하세요.</p></> : <p>이 버전은 공식 배포 목록에 서버 파일이 제공되지 않습니다. 게임은 Minecraft 런처에서 설치해 주세요.</p>}</aside>
    </div>
    <div className="mc-version-bottom"><p>리뱅 서버에서 지원하는 접속 버전은 서버 안내를 확인하세요.</p><Link className="text-link" href="/servers">리뱅 서버 안내 <ArrowUpRight size={16}/></Link><a className="text-link" href="https://www.minecraft.net/en-us/updates" target="_blank" rel="noopener noreferrer">Minecraft 공식 업데이트 <ArrowUpRight size={16}/></a></div>
  </PageFrame>;
}
