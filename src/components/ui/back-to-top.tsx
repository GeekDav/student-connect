"use client";

import { useEffect, useState } from "react";

export function BackToTop({
  /** Remonte un peu plus haut sur mobile à cause de la nav bottom. */
  offset = 480,
  /** `app` = au-dessus de la nav mobile ; `page` = site public sans nav bottom. */
  placement = "app",
}: {
  offset?: number;
  placement?: "app" | "page";
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > offset);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [offset]);

  if (!visible) return null;

  const position =
    placement === "page"
      ? "bottom-6 right-4 sm:bottom-8 sm:right-6"
      : "bottom-24 right-4 sm:bottom-8 sm:right-6";

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={`fixed z-30 inline-flex size-11 items-center justify-center rounded-xl border border-line bg-surface text-ink shadow-[0_8px_24px_rgba(19,32,41,0.12)] transition-[transform,opacity,background-color] hover:-translate-y-0.5 hover:bg-wash ${position}`}
      aria-label="Remonter en haut"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M12 19V5" />
        <path d="M5 12l7-7 7 7" />
      </svg>
    </button>
  );
}
