import Link from "next/link";

type Variant = "default" | "inverse" | "accent";

function LogoMark({
  className,
  variant,
}: {
  className?: string;
  variant: Variant;
}) {
  const windowFill =
    variant === "inverse" ? "var(--color-background)" : "var(--background)";
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M5 13.5 14 7.2a1.2 1.2 0 0 1 1.4 0L24.5 13.5V26a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 6.5 26V13.5Z"
        className="fill-current"
      />
      <rect
        x="10"
        y="17"
        width="3.2"
        height="3.2"
        rx="0.6"
        fill={windowFill}
        opacity={0.92}
      />
      <rect
        x="14.4"
        y="17"
        width="3.2"
        height="3.2"
        rx="0.6"
        fill={windowFill}
        opacity={0.92}
      />
      <rect
        x="10"
        y="21.8"
        width="3.2"
        height="3.2"
        rx="0.6"
        fill={windowFill}
        opacity={0.75}
      />
      <rect
        x="14.4"
        y="21.8"
        width="3.2"
        height="3.2"
        rx="0.6"
        fill={windowFill}
        opacity={0.75}
      />
      <path
        d="M19.5 12.5c2.5 0 4.5 2 4.5 4.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="26" cy="9.5" r="3.2" className="fill-current" />
      <circle
        cx="26"
        cy="9.5"
        r="1.1"
        className="fill-background opacity-95"
      />
    </svg>
  );
}

export function StudentConnectLogo({
  href,
  variant = "default",
  showText = "responsive",
  className = "",
}: {
  href?: string;
  variant?: Variant;
  /** responsive = texte à partir de sm ; false = icône seule (sr-only pour l’accessibilité) */
  showText?: boolean | "responsive";
  className?: string;
}) {
  const markTone =
    variant === "inverse"
      ? "text-white"
      : variant === "accent"
        ? "text-accent"
        : "text-accent";
  const textTone =
    variant === "inverse"
      ? "text-white/90"
      : variant === "accent"
        ? "text-accent"
        : "text-ink";

  const label = (
    <span
      className={`inline-flex min-w-0 max-w-full items-center gap-2 ${className}`}
    >
      <LogoMark
        variant={variant}
        className={`size-7 shrink-0 sm:size-8 ${markTone}`}
      />
      <span
        className={`truncate font-display text-sm font-semibold tracking-wide ${textTone} ${
          showText === "responsive"
            ? "hidden sm:inline"
            : showText
              ? "inline"
              : "sr-only"
        }`}
      >
        Student-Connect
      </span>
    </span>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="inline-flex min-w-0 max-w-full transition-opacity hover:opacity-70"
      >
        {label}
      </Link>
    );
  }

  return label;
}