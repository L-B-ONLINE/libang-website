import Link from "@/components/site-link";
import SocialLinks from "./social-links";
const groups = [
  { title: "서버", links: [{ label: "Dongwon", href: "/servers/dongwon" }, { label: "Bose", href: "/servers/bose" }, { label: "ReAbility", href: "/servers/reability" }] },
  { title: "커뮤니티", links: [{ label: "포럼", href: "/forum" }, { label: "공지", href: "/forum?category=notice" }, { label: "질문", href: "/forum?category=question" }] },
  { title: "가이드", links: [{ label: "접속 방법", href: "/guide#connect" }, { label: "명령어", href: "/guide#commands" }, { label: "이용 규칙", href: "/guide#rules" }, { label: "업데이트 소식", href: "/minecraft" }, { label: "버전 라이브러리", href: "/minecraft/versions" }] },
];
export default function SiteFooter() {
  return <footer className="site-footer"><div className="shell"><div className="footer-top"><Link href="/" className="footer-brand"><img src="/brand.png" alt="" width="30" height="22"/><span>리뱅 온라인</span></Link><SocialLinks className="footer-social-links"/></div><nav className="footer-directory" aria-label="푸터 메뉴">{groups.map(group=><section key={group.title}><h2>{group.title}</h2><ul>{group.links.map(link=><li key={link.href}><Link href={link.href}>{link.label}</Link></li>)}</ul></section>)}</nav><div className="footer-legal"><small>© {new Date().getFullYear()} L.B ONLINE</small><p>공식 Minecraft 제품이 아닙니다. Mojang 또는 Microsoft와 제휴하지 않습니다.</p></div></div></footer>;
}
