"use client";

import { usePathname } from "next/navigation";
import Link from "@/components/site-link";
import "./minecraft.css";

export default function MinecraftLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return <>
    <div className="minecraft-subnav"><nav className="shell" aria-label="마인크래프트 메뉴">
      <Link href="/minecraft" aria-current={pathname === "/minecraft" ? "page" : undefined}>업데이트 소식</Link><Link href="/minecraft/versions" aria-current={pathname.startsWith("/minecraft/versions") ? "page" : undefined}>버전 라이브러리</Link>
    </nav></div>
    {children}
  </>;
}
