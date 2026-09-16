"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { loginUser } from "@/lib/actions/auth";

const fieldClass =
  "mt-2 w-full rounded-lg border border-line bg-surface px-3.5 py-3 text-[15px] text-ink outline-none transition-[border-color,box-shadow] placeholder:text-muted/70 focus:border-accent focus:shadow-[0_0_0_3px_rgba(12,107,92,0.12)]";

const labelClass = "block text-sm font-medium text-ink";

export function ConnexionForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [forgotHint, setForgotHint] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const next: { email?: string; password?: string } = {};

    if (!email.trim() || !email.includes("@")) {
      next.email = "Entre une adresse e-mail valide.";
    }
    if (!password) {
      next.password = "Entre ton mot de passe.";
    }

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setPending(true);
    setFormError(null);
    const result = await loginUser({ email, password });
    setPending(false);

    if (!result.ok) {
      setFormError(result.error);
      return;
    }

    router.push(result.redirectTo);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <div>
        <label htmlFor="email" className={labelClass}>
          E-mail
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          className={fieldClass}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setErrors((prev) => ({ ...prev, email: undefined }));
            setFormError(null);
          }}
        />
        {errors.email ? (
          <p className="mt-1.5 text-sm text-red-700" role="alert">
            {errors.email}
          </p>
        ) : null}
      </div>

      <div>
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="password" className={labelClass}>
            Mot de passe
          </label>
          <button
            type="button"
            className="text-xs font-medium text-muted transition-colors hover:text-ink"
            onClick={() => setForgotHint(true)}
          >
            Mot de passe oublié ?
          </button>
        </div>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          className={fieldClass}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setErrors((prev) => ({ ...prev, password: undefined }));
            setFormError(null);
          }}
        />
        {errors.password ? (
          <p className="mt-1.5 text-sm text-red-700" role="alert">
            {errors.password}
          </p>
        ) : null}
        {forgotHint ? (
          <p className="mt-2 text-xs leading-relaxed text-muted">
            Réinitialisation par e-mail : à venir.
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
        disabled={pending}
        className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-accent px-6 text-sm font-semibold text-white transition-[background-color,transform,opacity] hover:bg-accent-hover hover:-translate-y-0.5 disabled:opacity-60"
      >
        {pending ? "Connexion…" : "Se connecter"}
      </button>

      <p className="text-center text-sm text-muted">
        Pas encore de compte ?{" "}
        <Link
          href="/inscription"
          className="font-semibold text-ink transition-opacity hover:opacity-70"
        >
          Créer un compte
        </Link>
      </p>
    </form>
  );
}
