import Link from "@/components/site-link";
import { ArrowRight } from "@/components/site-icons";
import PageFrame from "../page-frame";
import ServerList from "../server-list";
import CopyAddress from "../copy-address";
export default function ServersPage() {
  return <PageFrame title="서버" className="servers-page" actions={<Link className="text-link" href="/guide#connect">접속 가이드 <ArrowRight size={17} /></Link>}>
    <ServerList />
    <section className="inline-connect"><div><h2>서버 주소</h2><p>로비에서 서버를 선택할 수 있습니다.</p></div><CopyAddress showAddress /></section>
    <section className="inline-connect"><div><h2>마인크래프트 버전 찾기</h2><p>게임 업데이트와 버전별 공식 배포 정보를 확인하세요.</p></div><Link className="text-link" href="/minecraft/versions">버전 라이브러리 <ArrowRight size={17}/></Link></section>
  </PageFrame>;
}
