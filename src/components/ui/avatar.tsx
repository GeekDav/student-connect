"use client";

import Image from "next/image";

type AvatarSize = "sm" | "md" | "lg" | "xl";

const SIZE_CLASS: Record<AvatarSize, string> = {
  sm: "size-9 text-xs",
  md: "size-12 text-sm",
  lg: "size-16 text-xl",
  xl: "size-24 text-3xl",
};

const PIXEL: Record<AvatarSize, number> = {
  sm: 36,
  md: 48,
  lg: 64,
  xl: 96,
};

export function Avatar({
  name,
  src,
  size = "md",
  className = "",
  ring = false,
}: {
  name: string;
  src?: string | null;
  size?: AvatarSize;
  className?: string;
  ring?: boolean;
}) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-[color-mix(in_oklab,var(--accent)_18%,white)] to-wash font-display font-semibold text-accent shadow-[inset_0_0_0_1px_rgba(19,32,41,0.06)] ${SIZE_CLASS[size]} ${
        ring
          ? "ring-2 ring-accent/25 ring-offset-2 ring-offset-background"
          : ""
      } ${className}`}
      aria-hidden={!src}
    >
      {src ? (
        <Image
          src={src}
          alt=""
          width={PIXEL[size]}
          height={PIXEL[size]}
          className="size-full object-cover"
          unoptimized
        />
      ) : (
        <span className="flex size-full items-center justify-center">
          {initials}
        </span>
      )}
    </div>
  );
}
