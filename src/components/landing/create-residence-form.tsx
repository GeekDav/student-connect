"use client";

import { useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { startSelfServeResidence } from "@/lib/actions/self-serve";
import type { PublicPricing } from "@/lib/stripe";

const fieldClass =
  "mt-2 w-full rounded-lg border border-line bg-surface px-3.5 py-3 text-[15px] text-ink outline-none transition-[border-color,box-shadow] placeholder:text-muted/70 focus:border-accent focus:shadow-[0_0_0_3px_rgba(12,107,92,0.12)]";

export function CreateResidenceForm({
  pricing,
  canceled,
}: {
  pricing: PublicPricing;
  canceled?: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    residenceName: "",
    city: "",
    address: "",
    operator: "",
    managerName: "",
    managerEmail: "",
    managerPassword: "",
    managerPasswordConfirm: "",
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (form.managerPassword !== form.managerPasswordConfirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    startTransition(async () => {
      const result = await startSelfServeResidence({
        residenceName: form.residenceName,
        city: form.city,
        address: form.address,
        operator: form.operator,
        managerName: form.managerName,
        managerEmail: form.managerEmail,
        managerPassword: form.managerPassword,
        managerPasswordConfirm: form.managerPasswordConfirm,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      window.location.href = result.url;
    });
  }

  return (
    <div className="mx-auto max-w-lg px-5 py-12 sm:px-8 sm:py-16">
      <p className="text-sm font-medium text-accent">
        <Link href="/" className="transition-opacity hover:opacity-70">
          Student-Connect
        </Link>
      </p>
      <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink">
        Équiper ma résidence
      </h1>
      <p className="mt-3 text-base leading-relaxed text-muted">
        {pricing.configured ? (
          <>
            {pricing.trialDays} jours d’essai, puis{" "}
            <strong className="text-ink">{pricing.amountLabel}</strong>{" "}
            {pricing.intervalLabel}. Carte demandée pour démarrer l’essai — tu
            peux annuler avant la fin.
          </>
        ) : (
          <>Inscription en ligne temporairement indisponible.</>
        )}
      </p>

      {canceled ? (
        <p className="mt-6 rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-muted">
          Paiement annulé. Ton compte a peut‑être déjà été créé —{" "}
          <Link href="/connexion" className="font-semibold text-accent">
            connecte-toi
          </Link>{" "}
          ou reprends ci‑dessous.
        </p>
      ) : null}

      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <fieldset className="space-y-4">
          <legend className="font-display text-sm font-semibold text-ink">
            Ta résidence
          </legend>
          <div>
            <label htmlFor="residenceName" className="text-sm font-medium text-ink">
              Nom
            </label>
            <input
              id="residenceName"
              className={fieldClass}
              required
              value={form.residenceName}
              onChange={(e) =>
                setForm((f) => ({ ...f, residenceName: e.target.value }))
              }
              placeholder="Résidence Les Lilas"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="city" className="text-sm font-medium text-ink">
                Ville
              </label>
              <input
                id="city"
                className={fieldClass}
                required
                value={form.city}
                onChange={(e) =>
                  setForm((f) => ({ ...f, city: e.target.value }))
                }
              />
            </div>
            <div>
              <label htmlFor="operator" className="text-sm font-medium text-ink">
                Groupe / opérateur
              </label>
              <input
                id="operator"
                className={fieldClass}
                value={form.operator}
                onChange={(e) =>
                  setForm((f) => ({ ...f, operator: e.target.value }))
                }
                placeholder="Optionnel"
              />
            </div>
          </div>
          <div>
            <label htmlFor="address" className="text-sm font-medium text-ink">
              Adresse
            </label>
            <input
              id="address"
              className={fieldClass}
              required
              value={form.address}
              onChange={(e) =>
                setForm((f) => ({ ...f, address: e.target.value }))
              }
            />
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="font-display text-sm font-semibold text-ink">
            Ton compte gestionnaire
          </legend>
          <div>
            <label htmlFor="managerName" className="text-sm font-medium text-ink">
              Nom complet
            </label>
            <input
              id="managerName"
              className={fieldClass}
              required
              value={form.managerName}
              onChange={(e) =>
                setForm((f) => ({ ...f, managerName: e.target.value }))
              }
            />
          </div>
          <div>
            <label
              htmlFor="managerEmail"
              className="text-sm font-medium text-ink"
            >
              E-mail professionnel
            </label>
            <input
              id="managerEmail"
              type="email"
              className={fieldClass}
              required
              autoComplete="email"
              value={form.managerEmail}
              onChange={(e) =>
                setForm((f) => ({ ...f, managerEmail: e.target.value }))
              }
            />
          </div>
          <div>
            <label
              htmlFor="managerPassword"
              className="text-sm font-medium text-ink"
            >
              Mot de passe
            </label>
            <input
              id="managerPassword"
              type="password"
              className={fieldClass}
              required
              minLength={8}
              autoComplete="new-password"
              value={form.managerPassword}
              onChange={(e) =>
                setForm((f) => ({ ...f, managerPassword: e.target.value }))
              }
            />
            <p className="mt-1.5 text-xs text-muted">8 caractères minimum.</p>
          </div>
          <div>
            <label
              htmlFor="managerPasswordConfirm"
              className="text-sm font-medium text-ink"
            >
              Confirmer le mot de passe
            </label>
            <input
              id="managerPasswordConfirm"
              type="password"
              className={fieldClass}
              required
              minLength={8}
              autoComplete="new-password"
              value={form.managerPasswordConfirm}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  managerPasswordConfirm: e.target.value,
                }))
              }
            />
          </div>
        </fieldset>

        {error ? (
          <p className="text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isPending || !pricing.configured}
          className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-accent px-4 text-sm font-semibold text-white transition-[background-color,transform,opacity] hover:bg-accent-hover hover:-translate-y-0.5 disabled:opacity-60"
        >
          {isPending
            ? "Redirection…"
            : `Démarrer l’essai (${pricing.trialDays} jours)`}
        </button>

        <p className="text-center text-xs leading-relaxed text-muted">
          Déjà un compte ?{" "}
          <Link href="/connexion?next=/gestionnaire" className="text-accent">
            Se connecter
          </Link>
        </p>
      </form>
    </div>
  );
}
