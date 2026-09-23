"use client";

import { useEffect } from "react";

/** Scrolle vers l’ancre au chargement / changement de hash (Next ignore souvent #). */
export function ScrollToHash() {
  useEffect(() => {
    function scrollToHash() {
      const hash = window.location.hash.replace(/^#/, "");
      if (!hash) return;
      const el = document.getElementById(hash);
      if (!el) return;
      // Laisse le layout se stabiliser (images hero, etc.)
      requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }

    scrollToHash();
    window.addEventListener("hashchange", scrollToHash);
    return () => window.removeEventListener("hashchange", scrollToHash);
  }, []);

  return null;
}
