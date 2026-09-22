import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="animate-soft-fade rounded-2xl border border-dashed border-line bg-wash/40 px-5 py-10 text-center">
      <div
        className="mx-auto mb-4 flex size-10 items-center justify-center rounded-xl bg-accent/10 text-accent"
        aria-hidden
      >
        <span className="font-display text-lg font-semibold">·</span>
      </div>
      <p className="font-display text-lg font-semibold text-ink">{title}</p>
      {description ? (
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
