import type { ReactNode } from "react";
export default function PageFrame({ title, children, actions, className = "" }: { title: string; children: ReactNode; actions?: ReactNode; className?: string }) {
  return <main className={`page-root ${className}`}><div className="shell"><div className="page-heading"><h1>{title}</h1>{actions && <div className="page-heading-actions">{actions}</div>}</div>{children}</div></main>;
}
