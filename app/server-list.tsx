import Link from "@/components/site-link";
import { servers } from "@/lib/servers";

export default function ServerList() {
  return (
    <ul className="v2-server-list">
      {servers.map(server => (
        <li key={server.slug}>
          <Link className="v2-server-row" href={`/servers/${server.slug}`}>
            <h2>{server.name}</h2>
            <p>{server.description}</p>
            <div className="v2-server-meta">
              <span>{server.genre}</span>
              <span>{server.status}</span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
