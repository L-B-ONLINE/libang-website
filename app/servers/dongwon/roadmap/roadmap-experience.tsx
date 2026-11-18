"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { flushSync } from "react-dom";
import { Dialog } from "radix-ui";
import Link from "@/components/site-link";
import { ArrowLeft, ArrowRight, X } from "@/components/site-icons";

const chapters = [
  {
    id: "smp",
    title: "Dongwon SMP",
    status: "지나온 시작",
    description: "함께 자원을 모으고 집을 지으며 동원의 첫 생존 세계를 만들었습니다.",
    action: "동원 가이드",
    href: "/guide#dongwon",
  },
  {
    id: "survival",
    title: "평화 야생",
    status: "현재 운영 중",
    description: "채집과 건축을 즐기며 각자의 속도로 살아가는 동원의 현재입니다.",
    action: "지금 시작하기",
    href: "/guide#dongwon",
  },
  {
    id: "rpg",
    title: "RPG",
    status: "향후 확장 계획",
    description: "동원을 RPG 콘텐츠로 확장할 계획입니다. 일정과 세부 내용은 준비되는 대로 안내합니다.",
    action: "개발 소식 보기",
    href: "/servers/updates?server=dongwon",
  },
] as const;

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function TypedDescription({ text, delay }: { text: string; delay: number }) {
  const [length, setLength] = useState<number | null>(null);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motion.matches) return;

    let index = 0;
    let timer: ReturnType<typeof setTimeout>;
    function typeNext() {
      index += 1;
      setLength(index);
      if (index < text.length) timer = setTimeout(typeNext, 25);
    }
    function finish() {
      clearTimeout(timer);
      setLength(text.length);
    }
    timer = setTimeout(typeNext, delay);
    motion.addEventListener("change", finish);
    return () => {
      clearTimeout(timer);
      motion.removeEventListener("change", finish);
    };
  }, [text, delay]);

  const visibleText = text.slice(0, length ?? 0);
  return (
    <p className="dw-description">
      <span className="dw-description-space" aria-hidden="true">{text}</span>
      <span className="dw-description-static">{text}</span>
      <span className="dw-description-typed" aria-hidden="true">
        {visibleText}
        {(length ?? 0) < text.length && <span className="dw-caret" />}
      </span>
    </p>
  );
}

export default function RoadmapExperience() {
  const [open, setOpen] = useState(false);
  const [chapter, setChapter] = useState(0);
  const [typingDelay, setTypingDelay] = useState(440);
  const surface = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const turn = useRef<Animation | null>(null);
  const phase = chapters[chapter];

  useEffect(() => () => turn.current?.cancel(), []);

  function changeOpen(next: boolean) {
    turn.current?.cancel();
    turn.current = null;
    if (next) {
      setChapter(0);
      setTypingDelay(440);
    }
    setOpen(next);
  }

  function showChapter(next: number) {
    setTypingDelay(160);
    setChapter(next);
    if (body.current) body.current.scrollTop = 0;
  }

  async function moveTo(next: number) {
    if (next < 0 || next >= chapters.length || next === chapter || turn.current) return;
    const panel = surface.current;
    if (!panel || typeof panel.animate !== "function" || prefersReducedMotion()) {
      showChapter(next);
      return;
    }

    const direction = next > chapter ? 1 : -1;
    const front = { transform: "translateX(0) rotateY(0) scale(1)", opacity: 1 };
    const outgoing = panel.animate(
      [front, { transform: `translateX(${-direction * 5}%) rotateY(${direction * 21}deg) scale(.96)`, opacity: 0 }],
      { duration: 180, easing: "cubic-bezier(.4,0,1,1)", fill: "forwards" },
    );
    turn.current = outgoing;
    try {
      await outgoing.finished;
      if (turn.current !== outgoing) return;
      flushSync(() => showChapter(next));
      const incoming = panel.animate(
        [{ transform: `translateX(${direction * 5}%) rotateY(${-direction * 21}deg) scale(.96)`, opacity: 0 }, front],
        { duration: 310, easing: "cubic-bezier(.16,1,.3,1)" },
      );
      turn.current = incoming;
      outgoing.cancel();
      await incoming.finished;
      if (turn.current === incoming) turn.current = null;
    } catch {
      // Closing the dialog cancels an in-flight turn.
    }
  }

  function handleKeys(event: KeyboardEvent<HTMLDivElement>) {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      void moveTo(chapter + (event.key === "ArrowRight" ? 1 : -1));
    }
  }

  return (
    <section id="roadmap" className="dw-roadmap" aria-labelledby="dw-heading">
      <Dialog.Root open={open} onOpenChange={changeOpen}>
        <div className="dw-overview">
          <div>
            <h2 id="dw-heading">동원 로드맵</h2>
            <ol className="dw-route">
              {chapters.map(({ id, title }) => (
                <li key={id} aria-current={id === "survival" ? "step" : undefined}>
                  {title}
                  {id !== "rpg" && <ArrowRight size={14} aria-hidden="true" />}
                </li>
              ))}
            </ol>
          </div>
          <Dialog.Trigger asChild>
            <button type="button" className="dw-open">로드맵 열기 <ArrowRight size={17} /></button>
          </Dialog.Trigger>
        </div>

        <Dialog.Portal>
          <Dialog.Overlay className="dw-overlay" />
          <Dialog.Content className="dw-dialog" onKeyDown={handleKeys}>
            <div ref={surface} className="dw-window" data-chapter={phase.id}>
              <header className="dw-window-header">
                <Dialog.Title>동원 로드맵</Dialog.Title>
                <Dialog.Description className="sr-only">
                  Dongwon SMP, 평화 야생, RPG의 세 단계를 살펴보세요. 방향키로도 이동할 수 있어요.
                </Dialog.Description>
                <Dialog.Close className="dw-close" aria-label="로드맵 닫기">
                  <X size={22} />
                </Dialog.Close>
              </header>

              <div ref={body} className="dw-window-body">
                <div className="dw-chapter" role="region" aria-label={phase.title}>
                  <span className="dw-status" data-current={chapter === 1}>{phase.status}</span>
                  <h3>{phase.title}</h3>
                  <TypedDescription key={phase.id} text={phase.description} delay={typingDelay} />
                  <Link className="dw-chapter-link" href={phase.href} onClick={() => changeOpen(false)}>
                    {phase.action} <ArrowRight size={17} />
                  </Link>
                </div>
              </div>

              <footer className="dw-window-footer">
                <div className="dw-steps" role="group" aria-label="로드맵 단계">
                  {chapters.map((item, index) => (
                    <button key={item.id} type="button" aria-pressed={index === chapter} onClick={() => void moveTo(index)}>
                      {item.title}
                    </button>
                  ))}
                </div>
                <div className="dw-arrows">
                  <button type="button" aria-label="이전 단계" aria-disabled={chapter === 0} onClick={() => void moveTo(chapter - 1)}>
                    <ArrowLeft size={20} />
                  </button>
                  <button type="button" aria-label="다음 단계" aria-disabled={chapter === chapters.length - 1} onClick={() => void moveTo(chapter + 1)}>
                    <ArrowRight size={20} />
                  </button>
                </div>
              </footer>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}
