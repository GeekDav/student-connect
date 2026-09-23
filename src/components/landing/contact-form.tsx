"use client";

import { useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { submitPilotContact } from "@/lib/actions/contact";

const fieldClass =
  "mt-2 w-full rounded-lg border border-line bg-surface px-3.5 py-3 text-[15px] text-ink outline-none transition-[border-color,box-shadow] placeholder:text-muted/70 focus:border-accent focus:shadow-[0_0_0_3px_rgba(12,107,92,0.12)]";

export function ContactForm() {
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    name: "",
    residenceName: "",
    city: "",
    email: "",
    message: "",
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await submitPilotContact(form);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDone(true);
      setForm({
        name: "",
        residenceName: "",
        city: "",
        email: "",
        message: "",
      });
    });
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-accent/30 bg-wash px-5 py-8">
        <p className="font-display text-xl font-semibold text-ink">
          Message envoyé
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Merci. On lit les candidatures au fil de l’eau et on revient vers toi
          si le pilote peut t’accueillir. Tu gardes la main : ce n’est pas une
          inscription automatique.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex h-10 items-center rounded-lg bg-accent px-4 text-sm font-semibold text-white transition-[background-color,transform] hover:bg-accent-hover hover:-translate-y-0.5"
        >
          Retour à l’accueil
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="contact-name" className="text-sm font-medium text-ink">
          Ton nom
        </label>
        <input
          id="contact-name"
          className={fieldClass}
          required
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
      </div>
      <div>
        <label
          htmlFor="contact-residence"
          className="text-sm font-medium text-ink"
        >
          Nom de la résidence
        </label>
        <input
          id="contact-residence"
          className={fieldClass}
          required
          value={form.residenceName}
          onChange={(e) =>
            setForm((f) => ({ ...f, residenceName: e.target.value }))
          }
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-city" className="text-sm font-medium text-ink">
            Ville
          </label>
          <input
            id="contact-city"
            className={fieldClass}
            required
            value={form.city}
            onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
          />
        </div>
        <div>
          <label
            htmlFor="contact-email"
            className="text-sm font-medium text-ink"
          >
            E-mail
          </label>
          <input
            id="contact-email"
            type="email"
            className={fieldClass}
            required
            autoComplete="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
        </div>
      </div>
      <div>
        <label
          htmlFor="contact-message"
          className="text-sm font-medium text-ink"
        >
          Message
        </label>
        <textarea
          id="contact-message"
          className={`${fieldClass} min-h-28 resize-y`}
          required
          minLength={10}
          maxLength={2000}
          value={form.message}
          onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
          placeholder="Taille de la résidence, ton rôle, pourquoi tu es intéressé…"
        />
      </div>

      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex h-11 items-center rounded-lg bg-accent px-4 text-sm font-semibold text-white transition-[background-color,transform,opacity] hover:bg-accent-hover hover:-translate-y-0.5 disabled:opacity-60"
      >
        {isPending ? "Envoi…" : "Envoyer la candidature"}
      </button>
    </form>
  );
}
