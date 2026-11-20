import Link from "@/components/site-link";
import Reatic from "@/components/reatic";
import { serverAddress } from "@/lib/servers";
import { LiveStatus } from "./server-status-provider";

export default function Home() {
  return (
    <main className="shell brand-home" aria-labelledby="brand-home-title">
      <div className="brand-home-identity">
        <h1 id="brand-home-title">
          <Reatic label="wordmark" className="brand-home-wordmark" fetchPriority="high" />
        </h1>
        <p className="brand-home-description"><Reatic label="description" /></p>
      </div>

      <div className="brand-home-connect">
        <div className="brand-address" role="group" aria-label="서버 접속 주소">
          <Reatic label="address" decorative />
          <code>{serverAddress}</code>
        </div>
        <Link className="brand-guide-link" href="/guide#connect">
          <Reatic label="connect" />
        </Link>
        <LiveStatus compact />
      </div>
    </main>
  );
}
