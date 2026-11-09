"use client";

export default function CatalogStatus({ children }: { children: React.ReactNode }) {
  return <div className="mc-unavailable" role="status"><p>{children}</p><button className="btn btn-quiet" type="button" onClick={() => window.location.reload()}>다시 불러오기</button></div>;
}
