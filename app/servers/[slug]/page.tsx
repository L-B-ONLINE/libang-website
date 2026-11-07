import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "@/components/site-icons";
import { servers } from "../../../lib/servers";
import CopyAddress from "../../copy-address";
import PageFrame from "../../page-frame";

export default async function ServerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const server = servers.find(entry => entry.slug === slug);
  if (!server) notFound();
  return <PageFrame title={server.name} actions={<a className="text-link" href="/servers"><ArrowLeft size={16} />서버 목록</a>} className="server-page">
    <div className="server-information"><article><div className="server-facts"><span>{server.genre}</span><span className={`availability availability-${server.slug}`}>{server.status}</span></div><h2>{server.genre}</h2><p className="server-lead">{server.description}</p><p>{server.guide}</p><div className="server-tags">{server.tags.map(tag => <span key={tag}>{tag}</span>)}</div></article><aside className="join-panel"><h2>{server.slug === "dongwon" ? "플레이 시작하기" : "공개 소식 확인하기"}</h2><p>{server.slug === "dongwon" ? "아래 주소로 접속한 뒤 로비에서 선택하세요." : "일정과 새로운 안내는 포럼에 게시됩니다."}</p>{server.slug === "dongwon" ? <><CopyAddress showAddress /><a className="text-link" href={`/guide#${server.slug}`}>처음 시작하는 방법 <ArrowRight size={17} /></a></> : <><a className="btn btn-primary" href="/forum?category=notice">공지 확인하기 <ArrowRight size={17} /></a><a className="text-link" href={`/guide#${server.slug}`}>서버 가이드 <ArrowRight size={17} /></a></>}</aside></div>
    <nav className="related-servers" aria-label="다른 서버">{servers.filter(entry => entry.slug !== slug).map(entry => <a key={entry.slug} href={`/servers/${entry.slug}`}><span>{entry.name}</span><small>{entry.genre}</small><ArrowRight size={20} /></a>)}</nav>
  </PageFrame>;
}
