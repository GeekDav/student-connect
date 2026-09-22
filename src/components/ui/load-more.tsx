"use client";

import { useEffect, useMemo, useState } from "react";

const DEFAULT_PAGE_SIZE = 8;

export function useLoadMore<T>(items: T[], pageSize = DEFAULT_PAGE_SIZE) {
  const [visibleCount, setVisibleCount] = useState(pageSize);

  // Reset when the filtered list shrinks / changes identity length abruptly
  useEffect(() => {
    setVisibleCount(pageSize);
  }, [items.length, pageSize]);

  const visible = useMemo(
    () => items.slice(0, visibleCount),
    [items, visibleCount],
  );
  const hasMore = visibleCount < items.length;
  const remaining = Math.max(0, items.length - visibleCount);

  function showMore() {
    setVisibleCount((n) => n + pageSize);
  }

  return { visible, hasMore, remaining, showMore, total: items.length };
}

export function LoadMoreButton({
  remaining,
  onClick,
}: {
  remaining: number;
  onClick: () => void;
}) {
  if (remaining <= 0) return null;

  return (
    <div className="mt-6 flex justify-center">
      <button
        type="button"
        onClick={onClick}
        className="inline-flex h-11 items-center justify-center rounded-lg border border-line bg-surface px-5 text-sm font-semibold text-ink transition-[transform,background-color] hover:-translate-y-0.5 hover:bg-wash"
      >
        Voir plus · {remaining} restant{remaining > 1 ? "s" : ""}
      </button>
    </div>
  );
}
