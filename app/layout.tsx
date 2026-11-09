import type { Metadata } from "next";
import "./site.css";
import "./globals.css";
import "./micro-interactions.css";
import "./admin/admin.css";
import "./design.css";
import "./portal.css";
import "./dongwon-roadmap.css";
import SiteHeader from "./site-header";
import { AuthProvider } from "./auth-provider";
import SiteFooter from "./site-footer";
import { PlayerIdentityProvider } from "./player-identity";
import { BookmarksProvider } from "./bookmarks-provider";
import { SearchProvider } from "./search-provider";
import { ServerStatusProvider } from "./server-status-provider";

export const metadata: Metadata = {
  title: "L.B ONLINE",
  metadataBase: new URL("https://web.libang.online"),
  icons: { icon: "/brand.png", apple: "/brand.png" },
  openGraph: { title: "L.B ONLINE", description: "리뱅 온라인. Minecraft 서버, 가이드, 커뮤니티.", images: [{ url: "/brand.png", alt: "리뱅 온라인 로고" }] },
  description: "L.B ONLINE 마인크래프트 서버 네트워크. 서버 접속, 플레이 가이드, 자유글과 질문을 확인하세요.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" data-theme="light" suppressHydrationWarning>
      <head><link rel="preload" href="/fonts/pretendard-ko-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" /><script dangerouslySetInnerHTML={{ __html: 'try{var t=localStorage.getItem("lb-theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t;else if(t==="system")delete document.documentElement.dataset.theme}catch{}' }} /></head>
      <body><AuthProvider><PlayerIdentityProvider><BookmarksProvider><SearchProvider><ServerStatusProvider><a className="skip-link" href="#main-content">본문으로 이동</a><SiteHeader /><div id="main-content">{children}</div><SiteFooter /></ServerStatusProvider></SearchProvider></BookmarksProvider></PlayerIdentityProvider></AuthProvider></body>
    </html>
  );
}
