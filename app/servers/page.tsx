import Link from "@/components/site-link";
import PageFrame from "../page-frame";
import ServerList from "../server-list";
import CopyAddress from "../copy-address";
import { LiveStatus } from "../server-status-provider";

export default function ServersPage() {
  return (
    <PageFrame title="서버" className="servers-page" actions={<Link className="text-link" href="/guide#connect">접속 가이드</Link>}>
      <ServerList />
      <div className="v2-network">
        <section aria-label="네트워크 상태"><LiveStatus /></section>
        <CopyAddress showAddress />
      </div>
      <div className="v2-server-links">
        <Link href="/servers/dongwon#roadmap">동원 로드맵</Link>
        <Link href="/servers/updates">리뱅 서버 소식</Link>
      </div>
    </PageFrame>
  );
}
