"use client";

import { startTransition, useEffect, useRef } from "react";

export const LIVE_POLL_DEFAULT_MS = 12_000;

/**
 * Rafraîchit des données sans reload.
 * - Onglet visible uniquement
 * - Pas de tick empilé si le précédent tourne encore
 * - Mises à jour en transition (ne bloque pas les clics)
 */
export function useLivePoll<T>(
  fetchData: () => Promise<T>,
  onData: (data: T) => void,
  enabled = true,
  intervalMs = LIVE_POLL_DEFAULT_MS,
) {
  const fetchRef = useRef(fetchData);
  const onDataRef = useRef(onData);
  const inFlightRef = useRef(false);
  fetchRef.current = fetchData;
  onDataRef.current = onData;

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    async function tick() {
      if (
        cancelled ||
        document.visibilityState !== "visible" ||
        inFlightRef.current
      ) {
        return;
      }
      inFlightRef.current = true;
      try {
        const next = await fetchRef.current();
        if (!cancelled) {
          startTransition(() => {
            onDataRef.current(next);
          });
        }
      } catch {
        /* ignore */
      } finally {
        inFlightRef.current = false;
      }
    }

    const startId = window.setTimeout(tick, Math.min(2500, intervalMs));
    const id = window.setInterval(tick, intervalMs);
    document.addEventListener("visibilitychange", tick);
    return () => {
      cancelled = true;
      window.clearTimeout(startId);
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [enabled, intervalMs]);
}
