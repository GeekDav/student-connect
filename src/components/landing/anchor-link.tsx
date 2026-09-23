"use client";

import type { ReactNode, MouseEvent } from "react";

/** Lien d’ancre fiable (Next Link + # est capricieux / no-op au 2ᵉ clic). */
export function AnchorLink({
  hash,
  className,
  children,
}: {
  hash: string;
  className?: string;
  children: ReactNode;
}) {
  const id = hash.replace(/^#/, "");

  function onClick(e: MouseEvent<HTMLAnchorElement>) {
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    window.history.pushState(null, "", `#${id}`);
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <a href={`#${id}`} className={className} onClick={onClick}>
      {children}
    </a>
  );
}
