import Link from "next/link";

export function ComingSoon({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="animate-hero-rise">
      <p className="font-display text-sm font-semibold text-accent">Bientôt</p>
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink">
        {title}
      </h1>
      <p className="mt-3 max-w-md text-base leading-relaxed text-muted">
        {description}
      </p>
      <Link
        href="/accueil"
        className="mt-8 inline-flex h-11 items-center justify-center rounded-lg border border-line bg-surface px-5 text-sm font-semibold text-ink transition-colors hover:bg-wash"
      >
        Retour à l’accueil
      </Link>
    </div>
  );
}
