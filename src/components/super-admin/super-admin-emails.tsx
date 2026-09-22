"use client";

import { useState, useTransition } from "react";
import {
  triggerWeeklyPausedReminders,
  type EmailLogItem,
} from "@/lib/actions/emails";

export function SuperAdminEmails({
  initialLogs,
  runtime,
}: {
  initialLogs: EmailLogItem[];
  runtime: { mode: string; appUrl: string; from: string };
}) {
  const [logs, setLogs] = useState(initialLogs);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onRunWeekly() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await triggerWeeklyPausedReminders();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMessage(
        `Rappel hebdo : ${result.sent} envoyé(s) / loggé(s), ${result.skipped} ignoré(s).`,
      );
      // Soft refresh via reload of page data
      window.location.reload();
    });
  }

  return (
    <div>
      <div className="animate-hero-rise">
        <h2 className="font-display text-3xl font-semibold tracking-tight text-ink">
          E-mails
        </h2>
        <p className="mt-2 max-w-xl text-base leading-relaxed text-muted">
          Mode test par défaut : les mails sont <strong>journalisés</strong>{" "}
          (pas d’envoi réel). Pour Resend :{" "}
          <code className="text-xs">EMAIL_MODE=resend</code> +{" "}
          <code className="text-xs">RESEND_API_KEY</code>.
        </p>
      </div>

      <ul className="animate-hero-rise-delay mt-8 grid gap-3 sm:grid-cols-3">
        <li className="rounded-2xl border border-line bg-surface px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Mode
          </p>
          <p className="mt-2 font-display text-xl font-semibold text-ink">
            {runtime.mode}
          </p>
        </li>
        <li className="rounded-2xl border border-line bg-surface px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            From
          </p>
          <p className="mt-2 break-all text-sm text-ink">{runtime.from}</p>
        </li>
        <li className="rounded-2xl border border-line bg-surface px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            APP_URL
          </p>
          <p className="mt-2 break-all text-sm text-ink">{runtime.appUrl}</p>
        </li>
      </ul>

      <div className="mt-8">
        <button
          type="button"
          disabled={isPending}
          onClick={onRunWeekly}
          className="inline-flex h-11 items-center rounded-lg bg-accent px-4 text-sm font-semibold text-white transition-[background-color,transform,opacity] hover:bg-accent-hover hover:-translate-y-0.5 disabled:opacity-60"
        >
          {isPending ? "Envoi…" : "Lancer le rappel hebdo (pause)"}
        </button>
        {message ? (
          <p className="mt-3 text-sm font-medium text-accent">{message}</p>
        ) : null}
        {error ? (
          <p className="mt-3 text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <section className="mt-12">
        <h3 className="font-display text-sm font-semibold tracking-wide text-ink">
          Journal · {logs.length}
        </h3>
        <ul className="mt-2 divide-y divide-line border-y border-line">
          {logs.map((log) => (
            <li key={log.id} className="py-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-display text-base font-semibold text-ink">
                  {log.subject}
                </p>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  {log.status}
                </p>
              </div>
              <p className="mt-1 text-sm text-muted">
                {log.to} · {log.template}
              </p>
              <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-muted">
                {log.bodyPreview}
              </p>
              <p className="mt-2 text-xs text-muted">
                {new Date(log.createdAt).toLocaleString("fr-FR")}
              </p>
            </li>
          ))}
          {logs.length === 0 ? (
            <li className="py-10 text-center text-sm text-muted">
              Aucun e-mail journalisé pour le moment.
            </li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
