import Link from "@/components/site-link";

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

export default function RoadmapExperience() {
  return (
    <section id="roadmap" className="dw-roadmap" aria-labelledby="dw-heading">
      <h2 id="dw-heading">동원 로드맵</h2>
      <ol className="dw-chapters">
        {chapters.map(chapter => (
          <li key={chapter.id} aria-current={chapter.id === "survival" ? "step" : undefined}>
            <span className="dw-status">{chapter.status}</span>
            <h3>{chapter.title}</h3>
            <p>{chapter.description}</p>
            <Link href={chapter.href} className="dw-chapter-link">{chapter.action}</Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
