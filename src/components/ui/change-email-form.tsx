"use client";

import { useState, useTransition, type FormEvent } from "react";
import { changeEmail } from "@/lib/actions/auth";

const fieldClass =
  "mt-2 w-full rounded-lg border border-line bg-surface px-3.5 py-3 text-[15px] text-ink outline-none transition-[border-color,box-shadow] placeholder:text-muted/70 focus:border-accent focus:shadow-[0_0_0_3px_rgba(12,107,92,0.12)]";

const labelClass = "block text-sm font-medium text-ink";

export function ChangeEmailForm({
  currentEmail,
  onEmailChanged,
}: {
  currentEmail: string;
  onEmailChanged?: (email: string) => void;
}) {
  const [email, setEmail] = useState(currentEmail);
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);

    startTransition(async () => {
      const result = await changeEmail({
        newEmail,
        currentPassword,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setEmail(result.email);
      setNewEmail("");
      setCurrentPassword("");
      setSaved(true);
      onEmailChanged?.(result.email);
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <p className="text-sm text-muted">
        E-mail actuel :{" "}
        <span className="font-medium text-ink">{email}</span>
      </p>
      <div>
        <label htmlFor="newEmail" className={labelClass}>
          Nouvel e-mail
        </label>
        <input
          id="newEmail"
          type="email"
          autoComplete="email"
          className={fieldClass}
          value={newEmail}
          onChange={(e) => {
            setNewEmail(e.target.value);
            setSaved(false);
            setError(null);
          }}
        />
      </div>
      <div>
        <label htmlFor="emailCurrentPassword" className={labelClass}>
          Mot de passe actuel
        </label>
        <input
          id="emailCurrentPassword"
          type="password"
          autoComplete="current-password"
          className={fieldClass}
          value={currentPassword}
          onChange={(e) => {
            setCurrentPassword(e.target.value);
            setSaved(false);
            setError(null);
          }}
        />
      </div>

      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      {saved ? (
        <p className="rounded-lg border border-accent/20 bg-accent/5 px-4 py-3 text-sm font-medium text-accent">
          E-mail mis à jour. Utilise-le à la prochaine connexion.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex h-11 items-center justify-center rounded-lg border border-line bg-surface px-5 text-sm font-semibold text-ink transition-colors hover:bg-wash disabled:opacity-60"
      >
        {isPending ? "Enregistrement…" : "Changer l’e-mail"}
      </button>
    </form>
  );
}
