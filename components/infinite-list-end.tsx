"use client";

import { useEffect, useRef } from "react";

export default function InfiniteListEnd({ shown, total, onLoadMore }: { shown: number; total: number; onLoadMore: () => void }) {
  const sentinel = useRef<HTMLDivElement>(null);
  const hasMore = shown < total;

  useEffect(() => {
    const target = sentinel.current;
    if (!hasMore || !target) return;
    let requested = false;
    const load = () => {
      if (requested) return;
      requested = true;
      onLoadMore();
    };
    if (typeof IntersectionObserver !== "undefined") {
      const observer = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) load();
      }, { rootMargin: "400px 0px" });
      observer.observe(target);
      return () => observer.disconnect();
    }
    const check = () => { if (target.getBoundingClientRect().top <= window.innerHeight + 400) load(); };
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    check();
    return () => { window.removeEventListener("scroll", check); window.removeEventListener("resize", check); };
  }, [hasMore, shown, total, onLoadMore]);

  if (!total) return null;
  return <div ref={sentinel} className="infinite-list-end" role="status" aria-live="polite" tabIndex={hasMore ? 0 : undefined} onFocus={() => { if (hasMore) onLoadMore(); }}>
    <span>{Math.min(shown, total).toLocaleString("ko-KR")} / {total.toLocaleString("ko-KR")}</span>
    <p>{hasMore ? "아래로 스크롤하면 다음 항목이 이어집니다." : "목록의 끝입니다."}</p>
  </div>;
}
