"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import Link from "@/components/site-link";
import Reatic from "@/components/reatic";
import { Bookmark, LogIn, LogOut, Search, Settings, Shield, UserPlus, UserRound } from "@/components/site-icons";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "./auth-provider";
import { PlayerName, SkinFace, usePlayerIdentity, usePlayerIdentityLoading } from "./player-identity";
import { useSiteSearch } from "./search-provider";

const links = [
  { href: "/servers", label: "servers" },
  { href: "/forum", label: "forum" },
  { href: "/guide", label: "guide" },
  { href: "/minecraft", label: "minecraft" },
] as const;
const appearances = [
  { key: "light", label: "라이트" },
  { key: "dark", label: "다크" },
  { key: "system", label: "자동" },
] as const;
type Theme = typeof appearances[number]["key"];

const themeChangeEvent = "libang:theme-change";
const colorScheme = "(prefers-color-scheme: dark)";

function subscribeToAppearance(listener: () => void) {
  const system = window.matchMedia(colorScheme);
  system.addEventListener("change", listener);
  window.addEventListener(themeChangeEvent, listener);
  return () => {
    system.removeEventListener("change", listener);
    window.removeEventListener(themeChangeEvent, listener);
  };
}

function readAppearance(): Theme {
  const theme = document.documentElement.dataset.theme;
  return theme === "dark" || theme === "light" ? theme : "system";
}

function isDarkAppearance() {
  const appearance = readAppearance();
  return appearance === "dark" || appearance === "system" && window.matchMedia(colorScheme).matches;
}

function setAppearance(value: string) {
  if (value !== "system" && value !== "dark" && value !== "light") return;
  if (value === "system") delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = value;
  try { localStorage.setItem("lb-theme", value); } catch {}
  window.dispatchEvent(new Event(themeChangeEvent));
}

export default function SiteHeader() {
  const pathname = usePathname();
  const search = useSiteSearch();
  const { session, client, loading: authLoading } = useAuth();
  const identityLoading = usePlayerIdentityLoading();
  const player = usePlayerIdentity(session?.user.id);
  const [menuPath, setMenuPath] = useState<string | null>(null);
  const [owner, setOwner] = useState<{ token: string; value: boolean } | null>(null);
  const theme = useSyncExternalStore(subscribeToAppearance, readAppearance, () => "light");
  const dark = useSyncExternalStore(subscribeToAppearance, isDarkAppearance, () => false);
  const accountOpen = menuPath !== null && menuPath === pathname;
  const isOwner = Boolean(session && owner?.token === session.access_token && owner.value);
  const name = String(session?.user.user_metadata?.username || session?.user.user_metadata?.full_name || "내 계정");

  if (menuPath !== null && menuPath !== pathname) setMenuPath(null);

  useEffect(() => {
    const close = () => setMenuPath(null);
    window.addEventListener("libang:close-menus", close);
    return () => window.removeEventListener("libang:close-menus", close);
  }, []);

  useEffect(() => {
    const token = session?.access_token;
    if (!token) return;
    const controller = new AbortController();
    void fetch("/api/auth/me", {
      headers: { authorization: `Bearer ${token}` },
      signal: controller.signal,
    }).then(async response => {
      const data = response.ok ? await response.json() as { isOwner?: boolean } : null;
      if (!controller.signal.aborted) setOwner({ token, value: Boolean(data?.isOwner) });
    }).catch(() => {
      if (!controller.signal.aborted) setOwner({ token, value: false });
    });
    return () => controller.abort();
  }, [session?.access_token]);

  return (
    <header className="site-header brand-header">
      <div className="shell header-line" data-home={pathname === "/" ? "true" : undefined}>
        <Link href="/" className="brand" aria-label="리뱅 온라인 홈">
          <Reatic label="wordmark" decorative />
          <Reatic label="online" decorative />
        </Link>

        <nav className="main-nav" aria-label="주 메뉴">
          {links.map(({ href, label }) => (
            <Link key={href} href={href} aria-current={pathname === href || pathname.startsWith(`${href}/`) ? "page" : undefined}>
              <Reatic label={label} />
            </Link>
          ))}
        </nav>

        <div className="header-utilities">
          <Link href="/guide#connect" className="header-connect"><Reatic label="join" /></Link>
          <DropdownMenu open={accountOpen} onOpenChange={open => setMenuPath(open ? pathname : null)} modal={false}>
            <DropdownMenuTrigger asChild>
              <button type="button" className="account-trigger" aria-label="계정 메뉴" title="계정 메뉴">
                {authLoading || identityLoading ? (
                  <span aria-hidden="true" className="account-placeholder" />
                ) : player?.skinUrl ? (
                  <SkinFace key={player.skinUrl} skinUrl={player.skinUrl} fallback={<UserRound size={18} />} />
                ) : <UserRound size={18} />}
                {session && <span className="signed-in-indicator" />}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={10}
              collisionPadding={16}
              className="account-dropdown"
              onCloseAutoFocus={event => { if (search.open) event.preventDefault(); }}
            >
              <DropdownMenuLabel className="account-identity">
                <strong>{session ? <PlayerName userId={session.user.id} name={name} /> : "리뱅 계정"}</strong>
                {session && <span>{session.user.email}</span>}
              </DropdownMenuLabel>
              <DropdownMenuGroup>
                {session ? (
                  <>
                    <DropdownMenuItem asChild className="account-item"><Link href="/profile"><UserRound size={17} />프로필 보기</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild className="account-item"><Link href="/account"><Settings size={17} />계정 설정</Link></DropdownMenuItem>
                    {isOwner && <DropdownMenuItem asChild className="account-item"><Link href="/admin"><Shield size={17} />관리자</Link></DropdownMenuItem>}
                  </>
                ) : (
                  <>
                    <DropdownMenuItem asChild className="account-item"><Link href="/login"><LogIn size={17} />로그인</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild className="account-item"><Link href="/login?mode=signup"><UserPlus size={17} />가입하기</Link></DropdownMenuItem>
                  </>
                )}
              </DropdownMenuGroup>
              <DropdownMenuItem asChild className="account-item"><Link href="/saved"><Bookmark size={17} />내 보관함</Link></DropdownMenuItem>
              <DropdownMenuSeparator className="account-separator" />
              <DropdownMenuLabel className="appearance-label">화면 모드</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={theme} onValueChange={setAppearance} className="appearance-options">
                {appearances.map(({ key, label }) => (
                  <DropdownMenuRadioItem key={key} value={key} className="appearance-choice" onSelect={event => event.preventDefault()}>
                    {label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
              {session && (
                <>
                  <DropdownMenuSeparator className="account-separator" />
                  <DropdownMenuItem className="account-item signout-item" onSelect={() => { void client?.auth.signOut(); }}>
                    <LogOut size={17} />로그아웃
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <button className="header-search-toggle" type="button" aria-label="통합 검색 열기" title="통합 검색 (Ctrl+K / ⌘K)" onClick={search.show}>
            <Search size={19} />
          </button>
          <button className="theme-toggle" type="button" aria-pressed={dark} onClick={() => setAppearance(dark ? "light" : "dark")}>
            <Reatic label="mode" />
          </button>
        </div>
      </div>
    </header>
  );
}
