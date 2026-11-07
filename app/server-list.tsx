import { ArrowRight } from "@/components/site-icons";
import { servers } from "../lib/servers";
export default function ServerList() {
  return <div className="server-directory">{servers.map((server,index) => <a className={`directory-server server-${server.slug}`} href={`/servers/${server.slug}`} key={server.slug}>
    <span className="directory-number">0{index+1}</span>
    <div className="directory-copy"><div className="directory-meta"><span>{server.genre}</span><span className={`server-state ${server.slug === "dongwon" ? "is-live" : ""}`}><i/>{server.status}</span></div><h2>{server.name}</h2><p>{server.description}</p><ul>{server.tags.map(tag => <li key={tag}>{tag}</li>)}</ul><span className="directory-details">서버 정보 <ArrowRight size={18}/></span></div>
  </a>)}</div>;
}
