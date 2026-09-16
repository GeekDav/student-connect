"use client";

import Link from "next/link";

export function ContactAuthorLink({
  authorId,
  isMine,
  label = "Contacter",
}: {
  authorId: string;
  isMine: boolean;
  label?: string;
}) {
  if (isMine) return null;

  return (
    <Link
      href={`/messages?with=${authorId}`}
      className="inline-flex h-11 items-center justify-center rounded-lg border border-line bg-surface px-4 text-sm font-semibold text-ink transition-colors hover:bg-wash"
    >
      {label}
    </Link>
  );
}
