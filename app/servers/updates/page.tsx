import type { Metadata } from "next";
import Link from "@/components/site-link";
import { ArrowRight } from "@/components/site-icons";
import PageFrame from "../../page-frame";
import { listServerUpdates } from "@/db/portal";
import UpdatesClient from "./updates-client";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "리뱅 서버 소식 | L.B ONLINE", description: "리뱅 서버의 업데이트, 개발 현황과 점검 안내를 확인하세요." };
export default async function ServerUpdatesPage() {
  let updates: Awaited<ReturnType<typeof listServerUpdates>> | null = null;
  try { updates = await listServerUpdates(); } catch { /* Render the data failure separately from React rendering. */ }
  if (!updates) return <PageFrame title="리뱅 서버 소식"><p className="portal-state" role="alert">소식을 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.</p></PageFrame>;
  return <PageFrame title="리뱅 서버 소식" className="server-updates-page" actions={<Link className="text-link" href="/servers/dongwon#roadmap">동원 로드맵 <ArrowRight size={17}/></Link>}><p className="portal-intro">서버의 변화와 다음 여정을 기록합니다.</p><UpdatesClient updates={updates}/></PageFrame>;
}
