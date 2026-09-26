"use client";

import { useEffect, useRef } from "react";

/**
 * Rafraîchit une liste côté client sans reload (onglet visible uniquement).
 * Même spirit que le polling Messages.
 */
export function useLivePoll<T>(
  fetchList: () => Promise<T[]>,
  onData: (items: T[]) => void,
  enabled = true,
  intervalMs = 4000,
) {
  const fetchRef = useRef(fetchList);
  const onDataRef = useRef(onData);
  fetchRef.current = fetchList;
  onDataRef.current = onData;

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    async function tick() {
      if (document.visibilityState !== "visible" || cancelled) return;
      try {
        const next = await fetchRef.current();
        if (!cancelled) onDataRef.current(next);
      } catch {
        /* ignore transient errors */
      }
    }

    const id = window.setInterval(tick, intervalMs);
    document.addEventListener("visibilitychange", tick);
    return () => {
      cancelled = true;
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [enabled, intervalMs]);
}
