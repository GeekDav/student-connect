"use client";

import { useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { submitPilotContact } from "@/lib/actions/contact";

const fieldClass =
  "mt-2 w-full rounded-lg border border-line bg-surface px-3.5 py-3 text-[15px] text-ink outline-none transition-[border-color,box-shadow] placeholder:text-muted/70 focus:border-accent focus:shadow-[0_0_0_3px_rgba(12,107,92,0.12)]";

const labelClass = "block text-sm font-medium text-ink";

type FormState = {
  name: string;
  residenceName: string;
  city: string;
  email: string;
  message: string;
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

const EMPTY: FormState = {
  name: "",
  residenceName: "",
  city: "",
  email: "",
  message: "",
};

function validate(form: FormState): FieldErrors {
  const next: FieldErrors = {};
  if (!form.name.trim()) next.name = "Indique ton nom.";
  if (!form.residenceName.trim()) {
    next.residenceName = "Indique le nom de la résidence.";
  }
  if (!form.city.trim()) next.city = "Indique la ville.";
  if (!form.email.trim() || !form.email.includes("@")) {
    next.email = "Entre une adresse e-mail professionnel valide.";
  }
  const message = form.message.trim();
  if (!message) next.message = "Écris un court message.";
  else if (message.length < 10) {
    next.message = "Message trop court (10 caractères mini).";
  } else if (message.length > 2000) {
    next.message = "Message trop long (2000 caractères max).";
  }
  return next;
}

export function ContactForm() {
  const [formError, setFormError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<FormState>(EMPTY);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setFormError(null);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const next = validate(form);
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setFormError(null);
    startTransition(async () => {
      const result = await submitPilotContact(form);
      if (!result.ok) {
        setFormError(result.error);
        return;
      }
      setDone(true);
      setForm(EMPTY);
      setErrors({});
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
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div>
        <label htmlFor="contact-name" className={labelClass}>
          Ton nom
        </label>
        <input
          id="contact-name"
          className={fieldClass}
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
        />
        {errors.name ? (
          <p className="mt-1.5 text-sm text-red-700" role="alert">
            {errors.name}
          </p>
        ) : null}
      </div>
      <div>
        <label htmlFor="contact-residence" className={labelClass}>
          Nom de la résidence
        </label>
        <input
          id="contact-residence"
          className={fieldClass}
          value={form.residenceName}
          onChange={(e) => update("residenceName", e.target.value)}
        />
        {errors.residenceName ? (
          <p className="mt-1.5 text-sm text-red-700" role="alert">
            {errors.residenceName}
          </p>
        ) : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-city" className={labelClass}>
            Ville
          </label>
          <input
            id="contact-city"
            className={fieldClass}
            value={form.city}
            onChange={(e) => update("city", e.target.value)}
          />
          {errors.city ? (
            <p className="mt-1.5 text-sm text-red-700" role="alert">
              {errors.city}
            </p>
          ) : null}
        </div>
        <div>
          <label htmlFor="contact-email" className={labelClass}>
            E-mail professionnel
          </label>
          <input
            id="contact-email"
            type="email"
            className={fieldClass}
            autoComplete="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
          />
          {errors.email ? (
            <p className="mt-1.5 text-sm text-red-700" role="alert">
              {errors.email}
            </p>
          ) : null}
        </div>
      </div>
      <div>
        <label htmlFor="contact-message" className={labelClass}>
          Message
        </label>
        <textarea
          id="contact-message"
          className={`${fieldClass} min-h-28 resize-y`}
          maxLength={2000}
          value={form.message}
          onChange={(e) => update("message", e.target.value)}
          placeholder="Taille de la résidence, ton rôle, pourquoi tu es intéressé…"
        />
        {errors.message ? (
          <p className="mt-1.5 text-sm text-red-700" role="alert">
            {errors.message}
          </p>
        ) : null}
      </div>

      {formError ? (
        <p className="text-sm text-red-700" role="alert">
          {formError}
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
