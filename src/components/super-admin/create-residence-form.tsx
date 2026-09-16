"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { createResidenceWithManager } from "@/lib/actions/super-admin";

const fieldClass =
  "mt-2 w-full rounded-lg border border-line bg-surface px-3.5 py-3 text-[15px] text-ink outline-none transition-[border-color,box-shadow] placeholder:text-muted/70 focus:border-accent focus:shadow-[0_0_0_3px_rgba(12,107,92,0.12)]";

const labelClass = "block text-sm font-medium text-ink";

type FormState = {
  name: string;
  city: string;
  address: string;
  operator: string;
  managerName: string;
  managerEmail: string;
  managerPassword: string;
};

const EMPTY: FormState = {
  name: "",
  city: "",
  address: "",
  operator: "",
  managerName: "",
  managerEmail: "",
  managerPassword: "",
};

export function CreateResidenceForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>(
    {},
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setFormError(null);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const next: Partial<Record<keyof FormState, string>> = {};

    if (!form.name.trim()) next.name = "Nom de la résidence requis.";
    if (!form.city.trim()) next.city = "Ville requise.";
    if (!form.address.trim()) next.address = "Adresse requise.";
    if (!form.operator.trim()) next.operator = "Gestionnaire / groupe requis.";
    if (!form.managerName.trim()) next.managerName = "Nom du gestionnaire requis.";
    if (!form.managerEmail.trim() || !form.managerEmail.includes("@")) {
      next.managerEmail = "E-mail professionnel valide requis.";
    }
    if (form.managerPassword.length < 8) {
      next.managerPassword = "Mot de passe temporaire : 8 caractères minimum.";
    }

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setFormError(null);
    startTransition(async () => {
      const result = await createResidenceWithManager(form);
      if (!result.ok) {
        setFormError(result.error);
        return;
      }
      setDone(true);
      router.refresh();
    });
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-line bg-surface p-8 sm:p-10">
        <p className="font-display text-sm font-semibold text-accent">
          Résidence créée
        </p>
        <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-ink">
          {form.name}
        </h2>
        <p className="mt-4 text-base leading-relaxed text-muted">
          Le compte gestionnaire{" "}
          <span className="font-medium text-ink">{form.managerEmail}</span> est
          créé. Pour l’instant (v0 locale),{" "}
          <span className="font-medium text-ink">
            aucun e-mail n’est envoyé automatiquement
          </span>
          : copie et envoie-lui toi-même ces identifiants.
        </p>
        <div className="mt-5 rounded-xl border border-line bg-wash/70 px-4 py-4 text-sm">
          <p className="text-muted">
            E-mail :{" "}
            <span className="font-medium text-ink">{form.managerEmail}</span>
          </p>
          <p className="mt-2 text-muted">
            Mot de passe temporaire :{" "}
            <span className="font-medium text-ink">{form.managerPassword}</span>
          </p>
        </div>
        <ul className="mt-6 space-y-2 text-sm text-muted">
          <li>
            Ville : <span className="text-ink">{form.city}</span>
          </li>
          <li>
            Gestionnaire : <span className="text-ink">{form.managerName}</span>
          </li>
        </ul>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/super-admin"
            className="inline-flex h-12 items-center justify-center rounded-lg bg-accent px-5 text-sm font-semibold text-white transition-[background-color,transform] hover:bg-accent-hover hover:-translate-y-0.5"
          >
            Voir les résidences
          </Link>
          <button
            type="button"
            onClick={() => {
              setDone(false);
              setForm(EMPTY);
              setFormError(null);
            }}
            className="inline-flex h-12 items-center justify-center rounded-lg border border-line bg-background px-5 text-sm font-semibold text-ink transition-colors hover:bg-wash"
          >
            Créer une autre résidence
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="animate-hero-rise">
        <Link
          href="/super-admin"
          className="text-sm font-medium text-muted transition-colors hover:text-ink"
        >
          ← Résidences
        </Link>
        <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-ink">
          Nouvelle résidence
        </h2>
        <p className="mt-2 max-w-xl text-base leading-relaxed text-muted">
          Une résidence partenaire + un compte admin résidence en une seule
          étape.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="animate-hero-rise-delay mt-8 space-y-8"
        noValidate
      >
        <section className="space-y-5">
          <h3 className="font-display text-sm font-semibold tracking-wide text-accent">
            1 · Résidence
          </h3>
          <div>
            <label htmlFor="name" className={labelClass}>
              Nom
            </label>
            <input
              id="name"
              className={fieldClass}
              placeholder="Ex. Nexity Studéa Lille Euralille"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
            />
            {errors.name ? (
              <p className="mt-1.5 text-sm text-red-700">{errors.name}</p>
            ) : null}
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="city" className={labelClass}>
                Ville
              </label>
              <input
                id="city"
                className={fieldClass}
                value={form.city}
                onChange={(e) => update("city", e.target.value)}
              />
              {errors.city ? (
                <p className="mt-1.5 text-sm text-red-700">{errors.city}</p>
              ) : null}
            </div>
            <div>
              <label htmlFor="operator" className={labelClass}>
                Groupe / opérateur
              </label>
              <input
                id="operator"
                className={fieldClass}
                placeholder="Ex. Nexity Studéa"
                value={form.operator}
                onChange={(e) => update("operator", e.target.value)}
              />
              {errors.operator ? (
                <p className="mt-1.5 text-sm text-red-700">{errors.operator}</p>
              ) : null}
            </div>
          </div>
          <div>
            <label htmlFor="address" className={labelClass}>
              Adresse
            </label>
            <input
              id="address"
              className={fieldClass}
              value={form.address}
              onChange={(e) => update("address", e.target.value)}
            />
            {errors.address ? (
              <p className="mt-1.5 text-sm text-red-700">{errors.address}</p>
            ) : null}
          </div>
        </section>

        <section className="space-y-5">
          <h3 className="font-display text-sm font-semibold tracking-wide text-accent">
            2 · Compte gestionnaire
          </h3>
          <div>
            <label htmlFor="managerName" className={labelClass}>
              Nom du gestionnaire
            </label>
            <input
              id="managerName"
              className={fieldClass}
              placeholder="Ex. Paul Mercier"
              value={form.managerName}
              onChange={(e) => update("managerName", e.target.value)}
            />
            {errors.managerName ? (
              <p className="mt-1.5 text-sm text-red-700">{errors.managerName}</p>
            ) : null}
          </div>
          <div>
            <label htmlFor="managerEmail" className={labelClass}>
              E-mail professionnel
            </label>
            <input
              id="managerEmail"
              type="email"
              className={fieldClass}
              value={form.managerEmail}
              onChange={(e) => update("managerEmail", e.target.value)}
            />
            {errors.managerEmail ? (
              <p className="mt-1.5 text-sm text-red-700">{errors.managerEmail}</p>
            ) : null}
          </div>
          <div>
            <label htmlFor="managerPassword" className={labelClass}>
              Mot de passe temporaire
            </label>
            <input
              id="managerPassword"
              type="password"
              autoComplete="new-password"
              className={fieldClass}
              value={form.managerPassword}
              onChange={(e) => update("managerPassword", e.target.value)}
            />
            <p className="mt-1.5 text-xs text-muted">
              À communiquer au gestionnaire pour sa première connexion.
            </p>
            {errors.managerPassword ? (
              <p className="mt-1.5 text-sm text-red-700">{errors.managerPassword}</p>
            ) : null}
          </div>
        </section>

        {formError ? (
          <p className="text-sm text-red-700" role="alert">
            {formError}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-accent px-6 text-sm font-semibold text-white transition-[background-color,transform,opacity] hover:bg-accent-hover hover:-translate-y-0.5 disabled:opacity-60 sm:w-auto"
        >
          {isPending
            ? "Création…"
            : "Créer résidence + gestionnaire"}
        </button>
      </form>
    </div>
  );
}
