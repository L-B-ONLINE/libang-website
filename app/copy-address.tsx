"use client";
import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "@/components/site-icons";
import { serverAddress } from "../lib/servers";

function copyUsingSelection() {
  const previous = document.activeElement as HTMLElement | null;
  const field = document.createElement("textarea");
  field.value = serverAddress;
  field.readOnly = true;
  field.style.cssText = "position:fixed;left:-9999px;top:0;font-size:16px";
  document.body.appendChild(field);
  field.select();
  field.setSelectionRange(0, field.value.length);
  let succeeded = false;
  try { succeeded = document.execCommand("copy"); }
  finally { field.remove(); previous?.focus({ preventScroll: true }); }
  return succeeded;
}

export default function CopyAddress({ className = "", showAddress = false }: { className?: string; showAddress?: boolean }) {
  const [copied, setCopied] = useState(false);
  const [fallback, setFallback] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  async function copy() {
    let succeeded = false;
    try {
      if (navigator.clipboard?.writeText) {
        try { await navigator.clipboard.writeText(serverAddress); succeeded = true; }
        catch { succeeded = copyUsingSelection(); }
      } else succeeded = copyUsingSelection();
    } catch { /* Show the selectable address when browser policy blocks copying. */ }
    if (!succeeded) { setFallback(true); return; }
    setFallback(false); setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 2400);
  }
  return <div className={`copy-control ${className}`}>
    <button className={`copy-address${showAddress ? " with-address" : ""}${copied ? " is-copied" : ""}`} type="button" onClick={() => void copy()} aria-label={copied ? "서버 주소 복사됨" : "서버 주소 복사"}>
      <span>{copied ? "복사됨" : showAddress ? serverAddress : "주소 복사"}</span>{copied ? <Check size={17} /> : <Copy size={17} />}
    </button>
    <span className="sr-only" role="status">{copied ? "서버 주소를 복사했습니다." : ""}</span>
    {fallback && <label className="copy-fallback">길게 눌러 복사하세요<input readOnly value={serverAddress} onFocus={event => event.target.select()} autoFocus /></label>}
  </div>;
}
