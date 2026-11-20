import SocialLinks from "./social-links";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell v2-footer-inner">
        <SocialLinks className="footer-social-links" />
        <div className="footer-legal">
          <small>© {new Date().getFullYear()} L.B ONLINE</small>
          <p>공식 Minecraft 제품이 아닙니다. Mojang 또는 Microsoft와 제휴하지 않습니다.</p>
        </div>
      </div>
    </footer>
  );
}
