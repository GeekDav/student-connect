"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { registerStudent } from "@/lib/actions/auth";

export type ResidenceOption = {
  id: string;
  name: string;
  city: string;
  operator: string;
};

type Step = 1 | 2 | 3;

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  passwordConfirm: string;
  residenceId: string;
  school: string;
  fieldOfStudy: string;
  interests: string;
  roomNumber: string;
  nationality: string;
  showNationality: boolean;
};

const INITIAL: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  passwordConfirm: "",
  residenceId: "",
  school: "",
  fieldOfStudy: "",
  interests: "",
  roomNumber: "",
  nationality: "",
  showNationality: false,
};

const STEPS = [
  { id: 1, label: "Compte" },
  { id: 2, label: "Résidence" },
  { id: 3, label: "Profil" },
] as const;

const fieldClass =
  "mt-2 w-full rounded-lg border border-line bg-surface px-3.5 py-3 text-[15px] text-ink outline-none transition-[border-color,box-shadow] placeholder:text-muted/70 focus:border-accent focus:shadow-[0_0_0_3px_rgba(12,107,92,0.12)]";

const labelClass = "block text-sm font-medium text-ink";

export function InscriptionForm({
  residences,
}: {
  residences: ResidenceOption[];
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormState>(INITIAL);
  const [query, setQuery] = useState("");
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>(
    {},
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const filteredResidences = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return residences;
    return residences.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.city.toLowerCase().includes(q) ||
        r.operator.toLowerCase().includes(q),
    );
  }, [query, residences]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setFormError(null);
  }

  function validateStep(current: Step): boolean {
    const nextErrors: Partial<Record<keyof FormState, string>> = {};

    if (current === 1) {
      if (!form.firstName.trim()) nextErrors.firstName = "Indique ton prénom.";
      if (!form.lastName.trim()) nextErrors.lastName = "Indique ton nom.";
      if (!form.email.trim() || !form.email.includes("@")) {
        nextErrors.email = "Entre une adresse e-mail valide.";
      }
      if (form.password.length < 8) {
        nextErrors.password = "Au moins 8 caractères.";
      }
      if (!form.passwordConfirm) {
        nextErrors.passwordConfirm = "Confirme ton mot de passe.";
      } else if (form.passwordConfirm !== form.password) {
        nextErrors.passwordConfirm = "Les mots de passe ne correspondent pas.";
      }
    }

    if (current === 2 && !form.residenceId) {
      nextErrors.residenceId = "Choisis ta résidence partenaire.";
    }

    if (current === 3) {
      if (!form.school.trim()) nextErrors.school = "Indique ton école ou université.";
      if (!form.fieldOfStudy.trim()) {
        nextErrors.fieldOfStudy = "Indique ton domaine d’études.";
      }
      if (!form.roomNumber.trim()) {
        nextErrors.roomNumber =
          "Le n° de chambre aide ton gestionnaire à te valider.";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function goNext() {
    if (!validateStep(step)) return;
    if (step === 3) {
      setPending(true);
      setFormError(null);
      const result = await registerStudent({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
        residenceId: form.residenceId,
        school: form.school,
        fieldOfStudy: form.fieldOfStudy,
        interests: form.interests,
        roomNumber: form.roomNumber,
        showNationality: form.showNationality,
        nationality: form.nationality,
      });
      setPending(false);
      if (!result.ok) {
        setFormError(result.error);
        return;
      }
      router.push(result.redirectTo);
      router.refresh();
      return;
    }
    setStep((step + 1) as Step);
  }

  function goBack() {
    if (step <= 1) return;
    setStep((step - 1) as Step);
  }

  return (
    <div>
      <ol className="mb-8 flex items-center gap-2" aria-label="Étapes">
        {STEPS.map((item, index) => {
          const active = step === item.id;
          const done = step > item.id;
          return (
            <li key={item.id} className="flex flex-1 items-center gap-2">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold transition-colors ${
                  active || done ? "bg-accent text-white" : "bg-wash text-muted"
                }`}
              >
                {item.id}
              </div>
              <span
                className={`hidden text-sm sm:inline ${
                  active ? "font-semibold text-ink" : "text-muted"
                }`}
              >
                {item.label}
              </span>
              {index < STEPS.length - 1 ? (
                <span
                  className={`ml-auto hidden h-px flex-1 sm:block ${
                    done ? "bg-accent/40" : "bg-line"
                  }`}
                  aria-hidden
                />
              ) : null}
            </li>
          );
        })}
      </ol>

      {step === 1 ? (
        <div className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Prénom" error={errors.firstName} htmlFor="firstName">
              <input
                id="firstName"
                autoComplete="given-name"
                className={fieldClass}
                value={form.firstName}
                onChange={(e) => update("firstName", e.target.value)}
              />
            </Field>
            <Field label="Nom" error={errors.lastName} htmlFor="lastName">
              <input
                id="lastName"
                autoComplete="family-name"
                className={fieldClass}
                value={form.lastName}
                onChange={(e) => update("lastName", e.target.value)}
              />
            </Field>
          </div>
          <Field label="E-mail" error={errors.email} htmlFor="email">
            <input
              id="email"
              type="email"
              autoComplete="email"
              className={fieldClass}
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
            />
          </Field>
          <Field
            label="Mot de passe"
            error={errors.password}
            htmlFor="password"
            hint="Minimum 8 caractères."
          >
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              className={fieldClass}
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
            />
          </Field>
          <Field
            label="Confirmer le mot de passe"
            error={errors.passwordConfirm}
            htmlFor="passwordConfirm"
          >
            <input
              id="passwordConfirm"
              type="password"
              autoComplete="new-password"
              className={fieldClass}
              value={form.passwordConfirm}
              onChange={(e) => update("passwordConfirm", e.target.value)}
            />
          </Field>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-5">
          <Field
            label="Rechercher ta résidence"
            htmlFor="residence-search"
            hint="Uniquement les résidences partenaires actives."
          >
            <input
              id="residence-search"
              className={fieldClass}
              placeholder="Nom, ville, gestionnaire…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </Field>

          <fieldset>
            <legend className="sr-only">Liste des résidences</legend>
            <ul className="max-h-72 space-y-2 overflow-y-auto pr-1">
              {filteredResidences.map((residence) => {
                const selected = form.residenceId === residence.id;
                return (
                  <li key={residence.id}>
                    <button
                      type="button"
                      onClick={() => update("residenceId", residence.id)}
                      className={`w-full rounded-xl border px-4 py-3.5 text-left transition-[border-color,background-color,transform] ${
                        selected
                          ? "border-accent bg-accent/5"
                          : "border-line bg-surface hover:border-accent/40 hover:bg-wash"
                      }`}
                    >
                      <span className="block font-medium text-ink">
                        {residence.name}
                      </span>
                      <span className="mt-1 block text-sm text-muted">
                        {residence.city} · {residence.operator}
                      </span>
                    </button>
                  </li>
                );
              })}
              {filteredResidences.length === 0 ? (
                <li className="rounded-xl border border-dashed border-line px-4 py-8 text-center text-sm text-muted">
                  Aucune résidence trouvée.
                </li>
              ) : null}
            </ul>
          </fieldset>
          {errors.residenceId ? (
            <p className="text-sm text-red-700" role="alert">
              {errors.residenceId}
            </p>
          ) : null}
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-5">
          <Field label="École / université" error={errors.school} htmlFor="school">
            <input
              id="school"
              className={fieldClass}
              placeholder="Ex. Université de Lille"
              value={form.school}
              onChange={(e) => update("school", e.target.value)}
            />
          </Field>
          <Field
            label="Domaine d’études"
            error={errors.fieldOfStudy}
            htmlFor="fieldOfStudy"
          >
            <input
              id="fieldOfStudy"
              className={fieldClass}
              placeholder="Ex. Droit, Médecine, Informatique…"
              value={form.fieldOfStudy}
              onChange={(e) => update("fieldOfStudy", e.target.value)}
            />
          </Field>
          <Field
            label="Centres d’intérêt"
            htmlFor="interests"
            hint="Optionnel — séparés par des virgules."
          >
            <input
              id="interests"
              className={fieldClass}
              placeholder="Ex. FIFA, cuisine, running"
              value={form.interests}
              onChange={(e) => update("interests", e.target.value)}
            />
          </Field>
          <Field
            label="Numéro de chambre"
            error={errors.roomNumber}
            htmlFor="roomNumber"
            hint="Visible uniquement par l’admin de ta résidence, pour te valider."
          >
            <input
              id="roomNumber"
              className={fieldClass}
              placeholder="Ex. 302"
              value={form.roomNumber}
              onChange={(e) => update("roomNumber", e.target.value)}
            />
          </Field>

          <div className="rounded-xl border border-line bg-wash/70 px-4 py-4">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                className="mt-1 size-4 rounded border-line accent-[var(--accent)]"
                checked={form.showNationality}
                onChange={(e) => {
                  update("showNationality", e.target.checked);
                  if (!e.target.checked) update("nationality", "");
                }}
              />
              <span>
                <span className="block text-sm font-medium text-ink">
                  Afficher ma nationalité / origine dans l’annuaire
                </span>
                <span className="mt-1 block text-sm text-muted">
                  Optionnel. Tu pourras le modifier plus tard dans ton profil.
                </span>
              </span>
            </label>
            {form.showNationality ? (
              <div className="mt-4">
                <label htmlFor="nationality" className={labelClass}>
                  Nationalité / origine
                </label>
                <input
                  id="nationality"
                  className={fieldClass}
                  placeholder="Ex. Sénégal, Canada, France…"
                  value={form.nationality}
                  onChange={(e) => update("nationality", e.target.value)}
                />
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {formError ? (
        <p className="mt-6 text-sm text-red-700" role="alert">
          {formError}
        </p>
      ) : null}

      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        {step > 1 ? (
          <button
            type="button"
            onClick={goBack}
            disabled={pending}
            className="inline-flex h-12 items-center justify-center rounded-lg border border-line bg-surface px-5 text-sm font-semibold text-ink transition-colors hover:bg-wash"
          >
            Retour
          </button>
        ) : (
          <Link
            href="/connexion"
            className="inline-flex h-12 items-center justify-center text-sm font-medium text-muted transition-colors hover:text-ink"
          >
            Déjà un compte ? Connexion
          </Link>
        )}
        <button
          type="button"
          onClick={goNext}
          disabled={pending}
          className="inline-flex h-12 items-center justify-center rounded-lg bg-accent px-6 text-sm font-semibold text-white transition-[background-color,transform,opacity] hover:bg-accent-hover hover:-translate-y-0.5 disabled:opacity-60"
        >
          {pending
            ? "Envoi…"
            : step === 3
              ? "Envoyer ma demande"
              : "Continuer"}
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className={labelClass}>
        {label}
      </label>
      {children}
      {hint && !error ? (
        <p className="mt-1.5 text-xs leading-relaxed text-muted">{hint}</p>
      ) : null}
      {error ? (
        <p className="mt-1.5 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
