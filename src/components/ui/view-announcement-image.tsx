"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";

export function ViewAnnouncementImage({
  src,
  title,
}: {
  src: string;
  title?: string;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const titleId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("keydown", onKey);
    document.documentElement.classList.add("sc-modal-open");

    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.classList.remove("sc-modal-open");
    };
  }, [open]);

  const label = title?.trim() || "Image de l’annonce";

  const modal =
    open && mounted
      ? createPortal(
          <div
            className="sc-lightbox fixed inset-0 z-[100] overflow-y-auto overscroll-contain"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onClick={() => setOpen(false)}
          >
            <div className="sc-lightbox-backdrop pointer-events-none fixed inset-0 bg-[rgba(12,22,28,0.72)] backdrop-blur-md" />

            <div className="relative flex min-h-full items-center justify-center p-4 sm:p-8">
              <div
                className="sc-lightbox-panel w-full max-w-[min(92vw,52rem)] overflow-hidden rounded-3xl border border-white/15 bg-surface shadow-[0_30px_100px_rgba(0,0,0,0.45)]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between gap-3 border-b border-line/80 bg-surface px-4 py-3.5 sm:px-5">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
                      Pièce jointe
                    </p>
                    <p
                      id={titleId}
                      className="mt-0.5 truncate font-display text-base font-semibold text-ink sm:text-lg"
                    >
                      {label}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-line bg-wash text-ink transition-[background-color,transform] hover:scale-105 hover:bg-line/50"
                    aria-label="Fermer"
                  >
                    <CloseGlyph />
                  </button>
                </div>

                <div className="max-h-[min(78vh,760px)] overflow-auto bg-[linear-gradient(180deg,#0f1c22_0%,#15262e_100%)] p-3 sm:p-5">
                  <div className="flex min-h-[12rem] items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt={`Illustration — ${label}`}
                      className="mx-auto block h-auto max-h-[min(70vh,700px)] w-auto max-w-full rounded-xl object-contain shadow-[0_12px_40px_rgba(0,0,0,0.35)]"
                    />
                  </div>
                </div>

                <p className="border-t border-line bg-wash/50 px-4 py-2.5 text-center text-xs text-muted sm:px-5">
                  Clique en dehors du cadre, sur ×, ou appuie sur Échap pour
                  fermer
                </p>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-sm font-semibold text-ink transition-colors hover:border-accent/35 hover:bg-accent/5 hover:text-accent"
      >
        <ImageGlyph />
        Voir l’image
      </button>
      {modal}
    </>
  );
}

function ImageGlyph() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="8.5" cy="10" r="1.5" />
      <path d="m21 15-4.5-4.5L9 18" />
    </svg>
  );
}

function CloseGlyph() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
