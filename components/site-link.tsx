"use client";

import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { useRouter } from "next/navigation";

// Keep the root auth/profile providers mounted during ordinary site navigation.
// Preserve normal anchors for new tabs, downloads, and modified clicks.
const SiteLink = forwardRef<HTMLAnchorElement, ComponentPropsWithoutRef<"a">>(function SiteLink({ href, onClick, target, ...props }, ref) {
  const router = useRouter();
  return <a {...props} ref={ref} href={href} target={target} onClick={event => {
    onClick?.(event);
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || target && target !== "_self" || props.download !== undefined || !href?.startsWith("/") || href.startsWith("//")) return;
    event.preventDefault();
    router.push(href);
  }} />;
});

export default SiteLink;
