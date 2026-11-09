"use client";

import { useEffect, useRef } from "react";
import Link from "@/components/site-link";
import { ArrowLeft, ArrowRight, Check } from "@/components/site-icons";
const stages = [
  { id: "smp", number: "01", label: "지나온 시작", title: "Dongwon SMP", english: "THE BEGINNING", description: "함께 시작한 생존의 첫 챕터.", content: "블록을 쌓고, 자원을 모으고, 서로의 이야기가 만나기 시작한 동원의 출발점입니다.", status: "completed" },
  { id: "peaceful", number: "02", label: "지금 플레이하는 동원", title: "평화 야생", english: "WHERE WE ARE", description: "편안하게 머물며 쌓아가는 오늘.", content: "동원은 현재 평화야생으로 운영 중입니다. 채집과 건축, 일상의 생존을 즐기며 다음 여정의 기반을 만들어갑니다.", status: "current" },
  { id: "rpg", number: "03", label: "다음 챕터 · 계획", title: "RPG", english: "WHAT COMES NEXT", description: "더 넓은 모험으로 이어질 다음 장.", content: "향후 RPG 콘텐츠로 확장할 예정입니다. 구체적인 콘텐츠와 개발 일정은 준비되는 대로 리뱅 서버 소식에서 안내합니다.", status: "planned" },
] as const;

export default function RoadmapExperience() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = root.current; if (!element) return;
    const cards = [...element.querySelectorAll<HTMLElement>(".roadmap-stage")];
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || typeof IntersectionObserver === "undefined") return;
    element.dataset.ready = "true";
    const timers: ReturnType<typeof setTimeout>[] = [];
    const observer = new IntersectionObserver(entries => { for (const entry of entries) if (entry.isIntersecting) { const target = entry.target as HTMLElement; timers.push(setTimeout(() => { target.dataset.visible = "true"; }, Number(target.dataset.index) * 140)); observer.unobserve(target); } }, { threshold: 0.12 });
    cards.forEach(card => observer.observe(card));
    return () => { observer.disconnect(); timers.forEach(clearTimeout); };
  }, []);
  return <main className="roadmap-page"><div className="shell" ref={root}>
    <Link className="text-link roadmap-back" href="/servers/dongwon"><ArrowLeft size={17}/>Dongwon 서버</Link>
    <header className="roadmap-intro"><span className="roadmap-eyebrow">DONGWON / THE JOURNEY</span><h1><span>동원의</span><span>다음 장.</span></h1><p>SMP에서 평화 야생으로.<br/>그리고, 더 넓은 RPG의 세계로.</p><div className="roadmap-current"><span/>현재 챕터 — 평화 야생</div><div className="roadmap-intro-lines" aria-hidden="true"><i/><i/><i/></div></header>
    <section className="roadmap-journey" aria-label="동원 발전 로드맵"><div className="roadmap-stage-grid">{stages.map((stage, index) => <article key={stage.id} id={stage.id} data-index={index} className={`roadmap-stage is-${stage.status}`}>
      <div className="roadmap-node" aria-hidden="true">{stage.status === "completed" ? <Check size={18}/> : <span>{stage.number}</span>}</div>
      {index < stages.length - 1 && <div className="roadmap-connector" aria-hidden="true"><i/></div>}
      <div className="roadmap-stage-card"><span className="roadmap-stage-kicker">{stage.english}</span><span className="roadmap-phase-label">{stage.label}</span><h2>{stage.title}</h2><p className="roadmap-stage-lead">{stage.description}</p><p>{stage.content}</p>{stage.status === "current" ? <Link className="text-link" href="/guide#dongwon">지금 시작하기 <ArrowRight size={17}/></Link> : stage.status === "planned" ? <Link className="text-link" href="/servers/updates?server=dongwon">개발 소식 보기 <ArrowRight size={17}/></Link> : <span className="roadmap-complete-label"><Check size={15}/>동원이 지나온 첫 챕터</span>}</div>
    </article>)}</div></section>
    <footer className="roadmap-outro"><span>THE STORY CONTINUES</span><h2>지금의 블록이,<br/>다음 모험의 시작이 됩니다.</h2><p>평화 야생은 현재 운영 중이며, RPG는 향후 확장 계획입니다.<br/>발표 전까지 세부 일정과 콘텐츠는 확정되지 않았습니다.</p><Link className="btn btn-primary" href="/servers/updates?server=dongwon">동원 소식 확인하기 <ArrowRight size={18}/></Link></footer>
  </div></main>;
}
