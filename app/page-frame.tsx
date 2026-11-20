import type { ReactNode } from "react";
import Reatic from "@/components/reatic";

const sectionLabels = {
  서버: "servers",
  포럼: "forum",
  가이드: "guide",
} as const;

export default function PageFrame({ title, children, actions, className = "" }: {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  const label = Object.hasOwn(sectionLabels, title) ? sectionLabels[title as keyof typeof sectionLabels] : undefined;
  return (
    <main className={`page-root ${className}`}>
      <div className="shell page-layout" data-section={label}>
        <header className="page-heading">
          <h1>{label ? <Reatic label={label} /> : title}</h1>
          {actions && <div className="page-heading-actions">{actions}</div>}
        </header>
        <div className="page-body">{children}</div>
      </div>
    </main>
  );
}
