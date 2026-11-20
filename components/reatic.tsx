import type { ComponentPropsWithoutRef } from "react";

const labels = {
  wordmark: ["리뱅", 1808, 491],
  online: ["온라인", 256, 113],
  servers: ["서버", 168, 113],
  forum: ["포럼", 168, 113],
  guide: ["가이드", 256, 113],
  mode: ["흑색 모드", 520, 113],
  description: ["마인크래프트 Java 서버", 1529, 113],
  address: ["libang.online", 782, 148],
  connect: ["접속 방법", 520, 113],
  skip: ["본문으로 이동", 761, 113],
} as const;

type Props = Omit<ComponentPropsWithoutRef<"img">, "src" | "alt" | "width" | "height"> & {
  label: keyof typeof labels;
  decorative?: boolean;
};

/** Fixed brand labels rendered from the original Reatic typefaces. */
export default function Reatic({ label, decorative = false, className = "", ...props }: Props) {
  const [text, width, height] = labels[label];

  return (
    // The fixed PNG labels are already cropped, with their intrinsic ratio preserved.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      {...props}
      className={`reatic ${className}`.trim()}
      src={`/brand/reatic/${label}.png`}
      alt={decorative ? "" : text}
      width={width}
      height={height}
    />
  );
}
