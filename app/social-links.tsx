import { ArrowUpRight } from "@/components/site-icons";
export default function SocialLinks({className = ""}:{className?:string}) {
 return <nav className={`social-links ${className}`} aria-label="리뱅 외부 링크">
  <a className="social-link" href="https://discord.libang.online" target="_blank" rel="noreferrer"><img src="/discord-symbol.svg" width="22" height="17" alt=""/><span>Discord</span><ArrowUpRight size={16}/></a>
  <a className="social-link" href="https://github.com/L-B-ONLINE" target="_blank" rel="noreferrer"><img src="/github-mark.svg" width="20" height="20" alt=""/><span>GitHub</span><ArrowUpRight size={16}/></a>
  <a className="social-link" href="https://minelist.kr/servers/16704-libang.online" target="_blank" rel="noreferrer"><img className="minelist-wordmark" src="/minelist-logo.png" width="100" height="17" alt="마인리스트"/><ArrowUpRight size={16}/></a>
 </nav>;
}
