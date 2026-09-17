"use client";

export type BoardScope = "all" | "mine";

export function BoardScopeFilter({
  value,
  onChange,
  mineCount,
  allCount,
}: {
  value: BoardScope;
  onChange: (value: BoardScope) => void;
  mineCount: number;
  allCount: number;
}) {
  return (
    <div
      className="inline-flex rounded-lg border border-line bg-surface p-1"
      role="tablist"
      aria-label="Filtrer les annonces"
    >
      <button
        type="button"
        role="tab"
        aria-selected={value === "all"}
        onClick={() => onChange("all")}
        className={`inline-flex h-9 items-center rounded-md px-3.5 text-sm font-semibold transition-colors ${
          value === "all"
            ? "bg-accent text-white"
            : "text-muted hover:text-ink"
        }`}
      >
        Tous · {allCount}
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={value === "mine"}
        onClick={() => onChange("mine")}
        className={`inline-flex h-9 items-center rounded-md px-3.5 text-sm font-semibold transition-colors ${
          value === "mine"
            ? "bg-accent text-white"
            : "text-muted hover:text-ink"
        }`}
      >
        Les miens · {mineCount}
      </button>
    </div>
  );
}
