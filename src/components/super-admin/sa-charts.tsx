"use client";

type Segment = {
  label: string;
  value: number;
  color: string;
};

export function DonutChart({
  segments,
  centerLabel,
  centerValue,
}: {
  segments: Segment[];
  centerLabel: string;
  centerValue: string | number;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const size = 160;
  const stroke = 18;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  let offset = 0;
  const arcs =
    total === 0
      ? [
          {
            label: "Vide",
            color: "var(--line)",
            dash: c,
            gap: 0,
            offset: 0,
            value: 0,
          },
        ]
      : segments.map((seg) => {
          const len = (seg.value / total) * c;
          const arc = {
            label: seg.label,
            color: seg.color,
            dash: len,
            gap: c - len,
            offset,
            value: seg.value,
          };
          offset -= len;
          return arc;
        });

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {arcs.map((arc) => (
            <circle
              key={arc.label}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={arc.color}
              strokeWidth={stroke}
              strokeDasharray={`${arc.dash} ${arc.gap}`}
              strokeDashoffset={arc.offset}
              strokeLinecap="butt"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          ))}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <p className="font-display text-2xl font-semibold text-ink">
            {centerValue}
          </p>
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
            {centerLabel}
          </p>
        </div>
      </div>
      <ul className="w-full space-y-2">
        {segments.map((seg) => (
          <li
            key={seg.label}
            className="flex items-center justify-between gap-3 text-sm"
          >
            <span className="flex items-center gap-2 text-muted">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{ background: seg.color }}
              />
              {seg.label}
            </span>
            <span className="flex items-center gap-2">
              <span className="font-semibold tabular-nums text-ink">
                {seg.value}
              </span>
              {total > 0 ? (
                <span className="text-xs tabular-nums text-muted">
                  {Math.round((seg.value / total) * 100)} %
                </span>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function StackedActivityChart({
  series,
}: {
  series: {
    label: string;
    joins: number;
    sos: number;
    market: number;
    events: number;
    wall: number;
    total: number;
  }[];
}) {
  const max = Math.max(1, ...series.map((d) => d.total));
  const colors = {
    joins: "#1d4f7a",
    sos: "#9a4b1a",
    market: "#0c6b5c",
    events: "#5a6b75",
    wall: "#3d7a6a",
  };

  return (
    <div>
      <div className="flex h-48 items-end gap-1 sm:gap-1.5">
        {series.map((d) => {
          const h = (d.total / max) * 100;
          return (
            <div
              key={d.label}
              className="group relative flex min-w-0 flex-1 flex-col items-center justify-end"
              style={{ height: "100%" }}
              title={`${d.label} · ${d.total}`}
            >
              <div
                className="flex w-full flex-col-reverse overflow-hidden rounded-sm"
                style={{ height: `${Math.max(h, d.total > 0 ? 4 : 0)}%` }}
              >
                {(
                  [
                    ["wall", d.wall],
                    ["events", d.events],
                    ["market", d.market],
                    ["sos", d.sos],
                    ["joins", d.joins],
                  ] as const
                ).map(([key, value]) =>
                  value > 0 ? (
                    <div
                      key={key}
                      style={{
                        height: `${(value / d.total) * 100}%`,
                        background: colors[key],
                      }}
                    />
                  ) : null,
                )}
              </div>
              <span className="mt-2 hidden text-[10px] text-muted sm:block sm:rotate-0">
                {d.label.split(" ")[0]}
              </span>
            </div>
          );
        })}
      </div>
      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted">
        {(
          [
            ["Inscriptions", colors.joins],
            ["SOS", colors.sos],
            ["Recyclerie", colors.market],
            ["Events", colors.events],
            ["Mur", colors.wall],
          ] as const
        ).map(([label, color]) => (
          <li key={label} className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-sm"
              style={{ background: color }}
            />
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function HorizontalBars({
  items,
  valueLabel,
}: {
  items: { id: string; name: string; value: number; href?: string }[];
  valueLabel: string;
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className="space-y-3">
      {items.map((item) => {
        const inner = (
          <>
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <span className="truncate text-sm font-medium text-ink">
                {item.name}
              </span>
              <span className="shrink-0 text-xs tabular-nums text-muted">
                {item.value} {valueLabel}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-wash">
              <div
                className="h-full rounded-full bg-accent transition-[width]"
                style={{ width: `${(item.value / max) * 100}%` }}
              />
            </div>
          </>
        );
        return (
          <li key={item.id}>
            {item.href ? (
              <a href={item.href} className="block transition-opacity hover:opacity-80">
                {inner}
              </a>
            ) : (
              inner
            )}
          </li>
        );
      })}
      {items.length === 0 ? (
        <li className="py-6 text-center text-sm text-muted">Pas encore de données.</li>
      ) : null}
    </ul>
  );
}
