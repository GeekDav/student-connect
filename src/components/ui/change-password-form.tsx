"use client";

import { useState, useTransition, type FormEvent } from "react";
import { changePassword } from "@/lib/actions/auth";

const fieldClass =
  "mt-2 w-full rounded-lg border border-line bg-surface px-3.5 py-3 text-[15px] text-ink outline-none transition-[border-color,box-shadow] placeholder:text-muted/70 focus:border-accent focus:shadow-[0_0_0_3px_rgba(12,107,92,0.12)]";

const labelClass = "block text-sm font-medium text-ink";

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);

    startTransition(async () => {
      const result = await changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSaved(true);
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div>
        <label htmlFor="currentPassword" className={labelClass}>
          Mot de passe actuel
        </label>
        <input
          id="currentPassword"
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
      <div>
        <label htmlFor="newPassword" className={labelClass}>
          Nouveau mot de passe
        </label>
        <input
          id="newPassword"
          type="password"
          autoComplete="new-password"
          className={fieldClass}
          value={newPassword}
          onChange={(e) => {
            setNewPassword(e.target.value);
            setSaved(false);
            setError(null);
          }}
        />
        <p className="mt-1.5 text-xs text-muted">Au moins 8 caractères.</p>
      </div>
      <div>
        <label htmlFor="confirmPassword" className={labelClass}>
          Confirmer le nouveau mot de passe
        </label>
        <input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          className={fieldClass}
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
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
          Mot de passe mis à jour.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex h-11 items-center justify-center rounded-lg border border-line bg-surface px-5 text-sm font-semibold text-ink transition-colors hover:bg-wash disabled:opacity-60"
      >
        {isPending ? "Enregistrement…" : "Changer le mot de passe"}
      </button>
    </form>
  );
}
