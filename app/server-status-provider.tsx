"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { LiveServer } from "@/lib/portal-types";
const Context = createContext<{ servers: LiveServer[]; error: boolean; loading: boolean }>({ servers: [], error: false, loading: true });

export function ServerStatusProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname(); const enabled = pathname === "/" || pathname.startsWith("/servers");
  const [snapshot, setSnapshot] = useState<{ servers: LiveServer[]; error: boolean; loading: boolean }>({ servers: [], error: false, loading: true });
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController(); let pending = false;
    async function refresh() {
      if (pending || document.visibilityState === "hidden") return;
      pending = true;
      try { const response = await fetch("/api/servers/status", { signal: controller.signal }); const data = await response.json() as { servers: LiveServer[] }; if (!response.ok || !Array.isArray(data.servers)) throw new Error(); if (!controller.signal.aborted) setSnapshot({ servers: data.servers, error: false, loading: false }); }
      catch { if (!controller.signal.aborted) setSnapshot(value => ({ ...value, error: true, loading: false })); }
      finally { pending = false; }
    }
    void refresh(); const timer = setInterval(() => void refresh(), 30000); const visible = () => { if (document.visibilityState === "visible") void refresh(); };
    document.addEventListener("visibilitychange", visible);
    return () => { controller.abort(); clearInterval(timer); document.removeEventListener("visibilitychange", visible); };
  }, [enabled]);
  return <Context.Provider value={snapshot}>{children}</Context.Provider>;
}

export function LiveStatus({ slug = "network", compact = false, hideUnlinked = false }: { slug?: string; compact?: boolean; hideUnlinked?: boolean }) {
  const { servers, error, loading } = useContext(Context); const server = servers.find(server => server.slug === slug);
  if (hideUnlinked && (!server || server.state === "unlinked")) return null;
  const state = error ? "unknown" : server?.state ?? "unknown";
  const label = loading ? "상태 확인 중" : state === "online" ? "온라인" : state === "offline" ? "오프라인" : state === "unlinked" ? "연결 대기" : "상태 확인 지연";
  return <div className={`live-status${compact ? " is-compact" : ""}`} aria-label={`${server?.name ?? "리뱅 네트워크"} 상태`}>
    <span className={`live-state is-${state}`}><i aria-hidden="true"/>{label}</span>
    {state === "online" && server && <><span>{server.playersOnline !== null ? `${server.playersOnline.toLocaleString("ko-KR")}명 접속 중` : "접속 인원 확인 중"}</span>{server.version && <span className="live-version">접속 버전 {server.version}</span>}</>}
    {!compact && server?.updatedAt && <time dateTime={server.updatedAt}>{new Date(server.updatedAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Seoul" })} 확인</time>}
  </div>;
}
