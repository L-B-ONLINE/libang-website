"use client";
import Link from "@/components/site-link";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Pause, Play } from "@/components/site-icons";
import { servers } from "../lib/servers";

export default function FeaturedWorld() {
  const [selected, setSelected] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const clock = useRef(0);
  const progress = useRef<SVGRectElement>(null);
  const current = servers[selected];

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (preference.matches) setPaused(true);
    const update = () => { if (preference.matches) setPaused(true); };
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (paused || hovered || focused) return;
    let frame = 0;
    let previous = performance.now();
    const reset = () => { previous = performance.now(); };
    const animate = (now: number) => {
      if (document.visibilityState === "visible") clock.current += now - previous;
      if (clock.current >= 5000) {
        clock.current %= 5000;
        setSelected(value => (value + 1) % servers.length);
      }
      if (progress.current) progress.current.style.strokeDashoffset = String(100 - clock.current / 50);
      previous = now;
      frame = requestAnimationFrame(animate);
    };
    document.addEventListener("visibilitychange", reset);
    frame = requestAnimationFrame(animate);
    return () => { cancelAnimationFrame(frame); document.removeEventListener("visibilitychange", reset); };
  }, [paused, hovered, focused]);

  function choose(index: number) {
    setSelected(index);
    clock.current = 0;
    if (progress.current) progress.current.style.strokeDashoffset = "100";
  }

  return <section className="world-showcase" aria-label="리뱅 서버 둘러보기"
    onPointerEnter={event => { if (event.pointerType === "mouse") setHovered(true); }}
    onPointerLeave={() => setHovered(false)}
    onFocusCapture={event => { if (!(event.target as HTMLElement).closest(".rotation-control")) setFocused(true); }}
    onBlurCapture={event => { const next = event.relatedTarget as HTMLElement | null; if (!next || !event.currentTarget.contains(next) || next.closest(".rotation-control")) setFocused(false); }}>
    <div className={`world-scene scene-${current.slug}`}>
      <img src="/images/libang-world.webp" srcSet="/images/libang-world-640.webp 640w, /images/libang-world-960.webp 960w, /images/libang-world.webp 1659w" sizes="(max-width: 600px) calc(100vw - 40px), (max-width: 1300px) calc(100vw - 96px), 1240px" alt="숲과 마을, 강을 잇는 돌다리를 그린 리뱅 월드 일러스트" width="1659" height="948" fetchPriority="high" decoding="async" />
      <div className="world-caption" key={current.slug}>
        <span className="world-status"><span />{current.status} · {current.genre}</span>
        <h2>{current.name}</h2>
        <p>{current.tagline}</p>
        <Link href={`/servers/${current.slug}`} className="world-detail">서버 알아보기 <ArrowUpRight size={18} /></Link>
      </div>
      <span className="art-credit">리뱅 월드 · 컨셉 일러스트</span>
    </div>
    <div className="world-selector">
      <div className="world-tabs" role="group" aria-label="추천 서버 선택">
        {servers.map((server, index) => <button type="button" key={server.slug} aria-pressed={selected === index} className={selected === index ? "selected" : ""} onClick={() => choose(index)}>
          <span className="world-tab-name">{server.name}</span><span className="world-tab-genre">{server.genre}</span><span className={`availability availability-${server.slug}`}>{server.status}</span>
        </button>)}
      </div>
      <button className="rotation-control" type="button" onClick={() => { setFocused(false); setPaused(value => !value); }} aria-label={`추천 서버 자동 전환 ${paused ? "재개" : "일시정지"}`} aria-pressed={paused}>
        <svg viewBox="0 0 40 40" className="rotation-progress" aria-hidden="true"><rect x="1" y="1" width="38" height="38" pathLength="100" ref={progress} /></svg>
        {paused ? <Play size={15} /> : <Pause size={15} />}
      </button>
    </div>
  </section>;
}
