"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import Link from "@/components/site-link";
import { ArrowRight, Refresh } from "@/components/site-icons";
const phases = [
  { id: "smp", title: "Dongwon SMP", words: ["Dongwon", "SMP"], label: "지나온 시작", code: "THE BEGINNING", status: "지나온 챕터", lead: "하나의 블록에서, 우리의 이야기가 시작됐습니다.", description: "함께 자원을 모으고, 집을 짓고, 서로의 이야기를 쌓아 올린 동원의 첫 챕터입니다.", action: "동원 가이드", href: "/guide#dongwon" },
  { id: "peaceful", title: "평화 야생", words: ["평화", "야생"], label: "지금의 동원", code: "HERE & NOW", status: "현재 운영 중", lead: "서두르지 않아도 괜찮은, 우리가 머무는 세계.", description: "동원은 현재 평화 야생으로 운영 중입니다. 채집과 건축, 일상의 생존을 즐기며 다음 여정의 기반을 만들어갑니다.", action: "지금 시작하기", href: "/guide#dongwon" },
  { id: "rpg", title: "RPG", words: ["RPG"], label: "다음 모험 · 계획", code: "BEYOND THE BLOCK", status: "향후 확장 계획", lead: "익숙한 세계의 경계 너머, 다음 모험을 그립니다.", description: "향후 RPG 콘텐츠로 확장할 예정입니다. 구체적인 콘텐츠와 일정은 아직 확정되지 않았으며, 준비되는 소식부터 차례로 안내합니다.", action: "개발 소식 보기", href: "/servers/updates?server=dongwon" },
] as const;
const subscribeMotion = (notify: () => void) => { const media = window.matchMedia("(prefers-reduced-motion: reduce)"); media.addEventListener("change", notify); return () => media.removeEventListener("change", notify); };
const getMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const blockIds = Array.from({ length: 36 }, (_, index) => index);
function blockPosition(index: number, chapter: number, seed: number): CSSProperties {
  const column = index % 6, row = Math.floor(index / 6), angle = (index % 18) / 18 * Math.PI * 2;
  const height = ((index * 7 + seed * 3) % 5);
  const x = chapter === 0 ? (column - 2.5) * 43 : chapter === 1 ? (column - row) * 29 : Math.cos(angle) * (index < 18 ? 132 : 78);
  const y = chapter === 0 ? (row - 2.5) * 43 : chapter === 1 ? (column + row - 5) * 16 - height * 12 : Math.sin(angle) * (index < 18 ? 132 : 78);
  return { "--block-x": `${x}px`, "--block-y": `${y}px`, "--block-angle": `${chapter === 0 ? 0 : chapter === 1 ? -30 : index * 20 + 45}deg`, "--block-skew": `${chapter === 1 ? 30 : 0}deg`, "--block-size": chapter === 2 ? "16px" : "34px", "--block-depth": `${chapter === 1 ? height * 4 + 5 : 0}px`, "--block-tint": `${12 + (index * 13) % 65}%`, "--delay": `${index * 17}ms`, "--scatter-x": `${Math.sin(index * 12.7 + seed) * 220}px`, "--scatter-y": `${Math.cos(index * 7.3 + seed) * 180}px` } as CSSProperties;
}

export default function RoadmapExperience() {
  const root = useRef<HTMLElement>(null); const scene = useRef<HTMLDivElement>(null);
  const reduced = useSyncExternalStore(subscribeMotion, getMotion, () => true);
  const [chapter, setChapter] = useState(1); const [entered, setEntered] = useState(false); const [inView, setInView] = useState(false);
  const [playing, setPlaying] = useState(false); const [progress, setProgress] = useState(0); const progressRef = useRef(0);
  const [run, setRun] = useState(0); const [typed, setTyped] = useState<string>(phases[1].lead); const typedRef = useRef<string>(phases[1].lead); const [scatter, setScatter] = useState(false); const [seed, setSeed] = useState(0);
  const phase = phases[chapter];
  const blockStyles = useMemo(() => blockIds.map(index => blockPosition(index, chapter, seed)), [chapter, seed]);
  useEffect(() => {
    const element = root.current; if (!element) return;
    let started = false;
    const observer = new IntersectionObserver(entries => {
      const visible = entries[0].isIntersecting; setInView(visible);
      if (visible && !started) { started = true; setEntered(true); if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setChapter(0); setPlaying(true); } }
    }, { threshold: 0.12 });
    observer.observe(element); return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!playing || !inView || reduced) return;
    let frame = 0; let previous = 0; let lastPaint = 0;
    const step = (now: number) => {
      if (previous && document.visibilityState === "visible") progressRef.current = Math.min(1, progressRef.current + Math.min(100, now - previous) / 6500);
      previous = now;
      if (now - lastPaint > 60) { lastPaint = now; setProgress(progressRef.current); }
      if (progressRef.current >= 1) {
        if (chapter < phases.length - 1) { progressRef.current = 0; setProgress(0); setChapter(value => value + 1); }
        else { setPlaying(false); setProgress(1); }
      } else frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step); return () => cancelAnimationFrame(frame);
  }, [playing, inView, reduced, chapter, run]);
  useEffect(() => {
    if (!entered || reduced) return;
    let active = true; let timer: ReturnType<typeof setTimeout>; let current = typedRef.current; let removing = true;
    const write = () => {
      if (!active) return;
      if (removing) { current = current.slice(0, -3); typedRef.current = current; setTyped(current); if (!current) removing = false; timer = setTimeout(write, current ? 18 : 190); }
      else { current = phase.lead.slice(0, current.length + 1); typedRef.current = current; setTyped(current); if (current.length < phase.lead.length) timer = setTimeout(write, 37); }
    };
    timer = setTimeout(write, 120);
    return () => { active = false; clearTimeout(timer); };
  }, [phase.lead, entered, reduced, run]);
  useEffect(() => { if (!scatter) return; const timer = setTimeout(() => setScatter(false), 600); return () => clearTimeout(timer); }, [scatter]);
  function select(index: number) { setPlaying(false); progressRef.current = 0; setProgress(0); setChapter(index); }
  function replay() { setChapter(0); progressRef.current = 0; setProgress(0); setRun(value => value + 1); setPlaying(true); }
  return <section id="roadmap" ref={root} className="dw-roadmap" aria-labelledby="dw-heading" data-entered={entered} data-inview={inView} data-playing={playing && !reduced}>
    <header className="dw-heading"><div><span className="dw-eyebrow">DONGWON / AN UNFINISHED WORLD</span><h2 id="dw-heading">블록 너머의 이야기<span>.</span></h2><p>동원 로드맵 · SMP에서 평화 야생으로, 그리고 RPG로.</p></div><span className="dw-live-label"><i/>현재 동원은 평화 야생</span></header>
    <div className="dw-stage" data-chapter={chapter}>
      <div className="dw-grid" aria-hidden="true"/><div className="dw-scan" aria-hidden="true"/>
      <svg key={`frame-${chapter}-${run}`} className="dw-frame" viewBox="0 0 1000 600" preserveAspectRatio="none" aria-hidden="true"><path className="dw-frame-path" pathLength="1" d="M 1,80 V 1 H 300 M 700,1 H 999 V 520 M 999,560 V 599 H 700 M 300,599 H 1 V 120"/><path className="dw-trace" pathLength="1" d="M0,500 H170 L240,430 H450 L520,360 H760 L830,290 H1000"/></svg>
      <div className="dw-stage-meta"><span>DONGWON — CHAPTER 0{chapter + 1}</span><span key={`${chapter}-${run}`} className="dw-signal-text">{phase.code}</span></div>
      <div className="dw-copy"><span className="dw-phase-state" key={`state-${chapter}-${run}`}>0{chapter + 1} / {phase.label}</span><h3 key={`title-${chapter}-${run}`} aria-label={phase.title}>{phase.words.map((word, index) => <span className="dw-word-mask" key={word}><span style={{ "--word": index } as CSSProperties}>{word}</span></span>)}</h3><p className="dw-typewriter" aria-label={phase.lead}><span aria-hidden="true">{reduced || !entered ? phase.lead : typed}<i className="dw-caret"/></span></p><Link className="dw-chapter-link" href={phase.href}>{phase.action}<ArrowRight size={17}/></Link></div>
      <div className="dw-scene" ref={scene} data-scatter={scatter} aria-hidden="true" onPointerMove={event => { if (reduced || event.pointerType !== "mouse") return; const bounds = event.currentTarget.getBoundingClientRect(); event.currentTarget.style.setProperty("--pointer-x", `${((event.clientX - bounds.left) / bounds.width - .5) * 12}deg`); event.currentTarget.style.setProperty("--pointer-y", `${((event.clientY - bounds.top) / bounds.height - .5) * -10}deg`); }} onPointerLeave={() => { scene.current?.style.setProperty("--pointer-x", "0deg"); scene.current?.style.setProperty("--pointer-y", "0deg"); }}>
        <div className="dw-orbit dw-orbit-one"/><div className="dw-orbit dw-orbit-two"/><div className="dw-orbit dw-orbit-three"/>
        <div className="dw-world"><div className="dw-world-axis"/><div className="dw-world-axis is-vertical"/>{blockIds.map(index => <div key={index} className="dw-block" style={blockStyles[index]}><i/></div>)}<div className="dw-core"><span/><span/><span/></div></div>
        <div className="dw-scene-caption" key={`caption-${chapter}-${run}`}><span>{chapter === 0 ? "작은 시작, 수많은 가능성" : chapter === 1 ? "지금 우리가 만들어가는 세계" : "아직 쓰이지 않은 다음 챕터"}</span><i/></div>
        <div className="dw-coordinate is-top">{chapter === 0 ? "BUILD THE FIRST BLOCK" : chapter === 1 ? "MAKE YOURSELF AT HOME" : "IMAGINE WHAT COMES NEXT"}</div>
      </div>
      <div className="dw-stage-bottom"><span className="dw-status-tag">{phase.status}</span><button type="button" className="dw-shuffle" onClick={() => { setSeed(value => value + 1); setScatter(true); }} disabled={scatter || reduced}>블록 흔들기 <span aria-hidden="true">↗</span></button></div>
    </div>
    <div className="dw-controls"><div className="dw-chapters" role="group" aria-label="로드맵 챕터">{phases.map((item, index) => <button key={item.id} type="button" aria-pressed={chapter === index} onClick={() => select(index)}><span>0{index + 1}</span><strong>{item.title}</strong><small>{item.status}</small><i style={{ "--progress": `${chapter === index ? progress * 100 : index < chapter ? 100 : 0}%` } as CSSProperties}/></button>)}</div><div className="dw-playback"><button type="button" onClick={() => setPlaying(value => !value)} disabled={reduced} aria-label={playing ? "로드맵 자동 재생 일시정지" : "로드맵 자동 재생"}><span aria-hidden="true">{playing ? "Ⅱ" : "▷"}</span>{playing ? "일시정지" : "자동 재생"}</button><button type="button" onClick={replay} disabled={reduced}><Refresh size={14}/>처음부터</button></div></div>
    <div className="dw-phase-notes">{phases.map((item, index) => <article key={item.id} data-active={chapter === index}><span>0{index + 1} / {item.status}</span><h3>{item.title}</h3><p>{item.description}</p></article>)}</div>
    <p className="dw-plans-note">현재 운영 단계는 평화 야생입니다. RPG는 향후 확장 계획이며, 일정과 콘텐츠는 준비되는 대로 안내합니다.</p>
  </section>;
}
