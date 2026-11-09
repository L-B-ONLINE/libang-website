"use client";
import Link from "@/components/site-link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { ArrowRight, LogIn, LogOut, Settings, Shield, UserPlus } from "@/components/site-icons";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "./auth-provider";
import { SkinFace, PlayerName, usePlayerIdentity, usePlayerIdentityLoading } from "./player-identity";
import { UserRound as AccountIcon } from "@/components/site-icons";

const links = [{ href: "/servers", label: "서버" }, { href: "/forum", label: "포럼" }, { href: "/guide", label: "가이드" }, { href: "/minecraft", label: "마인크래프트" }];
type Theme = "system" | "light" | "dark";
export default function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { session, client, loading: authLoading } = useAuth();
  const identityLoading = usePlayerIdentityLoading();
  const player = usePlayerIdentity(session?.user.id);
  const [open, setOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuTrigger = useRef<HTMLButtonElement>(null);
  const [theme, setTheme] = useState<Theme>("light");
  const [owner, setOwner] = useState<{ token: string; value: boolean } | null>(null);
  const [easterVisible, setEasterVisible] = useState(false);
  const clicks = useRef({ count: 0, last: 0 });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isOwner = Boolean(session && owner?.token === session.access_token && owner.value);
  const name = String(session?.user.user_metadata?.username || session?.user.user_metadata?.full_name || "내 계정");
  useEffect(() => { try { const saved = localStorage.getItem("lb-theme"); if (saved === "dark" || saved === "light" || saved === "system") setTheme(saved); } catch {} }, []);
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    const media = window.matchMedia("(max-width:760px)");
    const closeDesktopMenu = () => { if (!media.matches) setMobileMenuOpen(false); };
    media.addEventListener("change", closeDesktopMenu);
    return () => media.removeEventListener("change", closeDesktopMenu);
  }, []);
  useEffect(() => {
    const token = session?.access_token;
    if (!token) return;
    let active = true;
    void fetch("/api/auth/me", { headers: { authorization: `Bearer ${token}` } }).then(async response => response.ok ? await response.json() as { isOwner?: boolean } : null)
      .then(data => { if (active) setOwner({ token, value: Boolean(data?.isOwner) }); }).catch(() => { if (active) setOwner({ token, value: false }); });
    return () => { active = false; };
  }, [session?.access_token]);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  function setAppearance(value: string) {
    if (value !== "system" && value !== "dark" && value !== "light") return;
    setTheme(value);
    if (value === "system") delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = value;
    try { localStorage.setItem("lb-theme", value); } catch {}
  }
  function brandClick(event: React.MouseEvent<HTMLAnchorElement>) {
    if (event.detail === 0 || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const now = Date.now();
    clicks.current.count = now - clicks.current.last < 550 ? clicks.current.count + 1 : 1;
    clicks.current.last = now;
    if (clicks.current.count >= 3) {
      clicks.current.count = 0;
      if (timer.current) clearTimeout(timer.current);
      setEasterVisible(true);
      timer.current = setTimeout(() => setEasterVisible(false), 3100);
    } else router.push("/");
  }
  return <>
    <header className="site-header"><div className="shell header-line">
      <Link href="/" className="brand" aria-label="L.B ONLINE 홈" onClick={brandClick}><img src="/brand.png" alt="" width="34" height="25" /><span className="brand-word">L.B <span>ONLINE</span></span></Link>
      <nav className="main-nav" aria-label="주 메뉴">{links.map(link => <Link key={link.href} href={link.href} aria-current={pathname.startsWith(link.href) ? "page" : undefined}>{link.label}</Link>)}</nav>
      <div className="header-utilities"><Link href="/guide#connect" className="header-connect">접속하기 <ArrowRight size={16} /></Link>
        <DropdownMenu open={open} onOpenChange={value => { setOpen(value); if (value) setMobileMenuOpen(false); }} modal={false}><DropdownMenuTrigger asChild><button type="button" className="account-trigger" aria-label="계정 메뉴" title="계정 메뉴">{authLoading || identityLoading ? <span aria-hidden="true" style={{ width: 18, height: 18 }} /> : player?.skinUrl ? <SkinFace key={player.skinUrl} skinUrl={player.skinUrl} fallback={<AccountIcon size={18}/>}/> : <AccountIcon size={18} />}{session && <span className="signed-in-indicator" />}</button></DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={10} collisionPadding={16} className="account-dropdown">
            <DropdownMenuLabel className="account-identity"><strong>{session ? <PlayerName userId={session.user.id} name={name}/> : "리뱅 계정"}</strong>{session && <span>{session.user.email}</span>}</DropdownMenuLabel>
            <DropdownMenuGroup>{session ? <><DropdownMenuItem asChild className="account-item"><Link href="/profile"><AccountIcon size={17}/>프로필 보기</Link></DropdownMenuItem><DropdownMenuItem asChild className="account-item"><Link href="/account"><Settings size={17} />계정 설정</Link></DropdownMenuItem>{isOwner && <DropdownMenuItem asChild className="account-item"><Link href="/admin"><Shield size={17} />관리자</Link></DropdownMenuItem>}</> : <><DropdownMenuItem asChild className="account-item"><Link href="/login"><LogIn size={17} />로그인</Link></DropdownMenuItem><DropdownMenuItem asChild className="account-item"><Link href="/login?mode=signup"><UserPlus size={17} />가입하기</Link></DropdownMenuItem></>}</DropdownMenuGroup>
            <DropdownMenuSeparator className="account-separator" /><DropdownMenuLabel className="appearance-label">화면 모드</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={theme} onValueChange={setAppearance} className="appearance-options">{[{ key: "light", label: "라이트" }, { key: "dark", label: "다크" }, { key: "system", label: "자동" }].map(item => <DropdownMenuRadioItem key={item.key} value={item.key} className="appearance-choice" onSelect={event => event.preventDefault()}>{item.label}</DropdownMenuRadioItem>)}</DropdownMenuRadioGroup>
            {session && <><DropdownMenuSeparator className="account-separator" /><DropdownMenuItem className="account-item signout-item" onSelect={() => { void client?.auth.signOut(); }}><LogOut size={17} />로그아웃</DropdownMenuItem></>}
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu open={mobileMenuOpen} onOpenChange={value => { setMobileMenuOpen(value); if (value) setOpen(false); }} modal={false}>
          <DropdownMenuTrigger asChild><button ref={mobileMenuTrigger} className="mobile-menu-toggle" type="button" aria-label={mobileMenuOpen ? "주 메뉴 닫기" : "주 메뉴 열기"}><span aria-hidden="true"/><span aria-hidden="true"/></button></DropdownMenuTrigger>
          <DropdownMenuContent className="mobile-nav-popup" aria-label="주 메뉴" aria-labelledby={undefined} align="end" sideOffset={15} collisionPadding={20} onCloseAutoFocus={event => event.preventDefault()} onEscapeKeyDown={() => mobileMenuTrigger.current?.focus()}>
            <DropdownMenuLabel className="mobile-nav-label">둘러보기</DropdownMenuLabel>
            {links.map(link => <DropdownMenuItem asChild key={link.href}><Link className="mobile-nav-link" href={link.href} onClick={() => setMobileMenuOpen(false)} aria-current={pathname.startsWith(link.href) ? "page" : undefined}>{link.label}<ArrowRight size={18}/></Link></DropdownMenuItem>)}
            <DropdownMenuSeparator/><DropdownMenuItem asChild><Link className="mobile-nav-link" href="/minecraft/versions" onClick={() => setMobileMenuOpen(false)}>버전 라이브러리<ArrowRight size={18}/></Link></DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div></header>
    {easterVisible && typeof document !== "undefined" && createPortal(<div className="logo-easter" role="status" onClick={() => setEasterVisible(false)}><span className="logo-easter-text">스래곤 게이</span></div>, document.body)}
  </>;
}
