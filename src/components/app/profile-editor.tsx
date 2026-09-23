"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useRef,
  useState,
  useTransition,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { Avatar } from "@/components/ui/avatar";
import { ChangeEmailForm } from "@/components/ui/change-email-form";
import { ChangePasswordForm } from "@/components/ui/change-password-form";
import {
  removeAvatar,
  setAvailability,
  updateProfile,
  uploadAvatar,
} from "@/lib/actions/profile";
import {
  prepareImageForUpload,
  uploadTransportError,
} from "@/lib/client-image";
import type { StudentProfile } from "@/data/mock-profile";

const fieldClass =
  "mt-2 w-full rounded-lg border border-line bg-surface px-3.5 py-3 text-[15px] text-ink outline-none transition-[border-color,box-shadow] placeholder:text-muted/70 focus:border-accent focus:shadow-[0_0_0_3px_rgba(12,107,92,0.12)]";

const labelClass = "block text-sm font-medium text-ink";

export function ProfileEditor({
  initialProfile,
  residenceName,
  initialAvatarUrl,
  initiallyAvailable = false,
  availableUntilLabel = null,
}: {
  initialProfile: StudentProfile;
  residenceName: string;
  initialAvatarUrl?: string | null;
  initiallyAvailable?: boolean;
  availableUntilLabel?: string | null;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<StudentProfile>(initialProfile);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    initialAvatarUrl ?? null,
  );
  const [isAvailable, setIsAvailable] = useState(initiallyAvailable);
  const [untilLabel, setUntilLabel] = useState(availableUntilLabel);
  const [errors, setErrors] = useState<
    Partial<Record<keyof StudentProfile, string>>
  >({});
  const [formError, setFormError] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarSuccess, setAvatarSuccess] = useState<string | null>(null);
  const [availabilityError, setAvailabilityError] = useState<string | null>(
    null,
  );
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [avatarPending, startAvatarTransition] = useTransition();
  const [availabilityPending, startAvailabilityTransition] = useTransition();

  function update<K extends keyof StudentProfile>(
    key: K,
    value: StudentProfile[K],
  ) {
    setProfile((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setSaved(false);
    setFormError(null);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const next: Partial<Record<keyof StudentProfile, string>> = {};

    if (!profile.firstName.trim()) next.firstName = "Prénom requis.";
    if (!profile.lastName.trim()) next.lastName = "Nom requis.";
    if (!profile.school.trim()) next.school = "École / université requise.";
    if (!profile.fieldOfStudy.trim()) {
      next.fieldOfStudy = "Domaine d’études requis.";
    }
    if (profile.showNationality && !profile.nationality.trim()) {
      next.nationality = "Indique ta nationalité, ou décoche l’option.";
    }

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setFormError(null);
    startTransition(async () => {
      const result = await updateProfile({
        firstName: profile.firstName,
        lastName: profile.lastName,
        school: profile.school,
        fieldOfStudy: profile.fieldOfStudy,
        interests: profile.interests,
        roomNumber: profile.roomNumber,
        showNationality: profile.showNationality,
        nationality: profile.nationality,
        bio: profile.bio,
      });

      if (!result.ok) {
        setFormError(result.error);
        setSaved(false);
        return;
      }

      setSaved(true);
      router.refresh();
    });
  }

  function onPickPhoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setAvatarError(null);
    setAvatarSuccess(null);

    startAvatarTransition(async () => {
      try {
        const prepared = await prepareImageForUpload(file, {
          maxEdge: 960,
          maxBytes: 1.4 * 1024 * 1024,
        });
        if (!prepared.ok) {
          setAvatarError(prepared.error);
          return;
        }

        const formData = new FormData();
        formData.set("avatar", prepared.file);
        const result = await uploadAvatar(formData);
        if (!result.ok) {
          setAvatarError(result.error);
          return;
        }
        if (result.avatarUrl) setAvatarUrl(result.avatarUrl);
        setAvatarSuccess(
          prepared.wasProcessed
            ? "Photo mise à jour (optimisée pour le mobile)."
            : "Photo mise à jour.",
        );
        router.refresh();
      } catch (err) {
        setAvatarError(uploadTransportError(err));
      }
    });
  }

  function onRemovePhoto() {
    setAvatarError(null);
    setAvatarSuccess(null);
    startAvatarTransition(async () => {
      const result = await removeAvatar();
      if (!result.ok) {
        setAvatarError(result.error);
        return;
      }
      setAvatarUrl(null);
      setAvatarSuccess("Photo retirée.");
      router.refresh();
    });
  }

  function onToggleAvailability(enabled: boolean) {
    setAvailabilityError(null);
    startAvailabilityTransition(async () => {
      const result = await setAvailability(enabled);
      if (!result.ok) {
        setAvailabilityError(result.error);
        return;
      }
      setIsAvailable(enabled);
      if (enabled) {
        const until = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        setUntilLabel(
          until.toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "short",
          }),
        );
      } else {
        setUntilLabel(null);
      }
      router.refresh();
    });
  }

  const fullName = `${profile.firstName} ${profile.lastName}`.trim() || "?";

  return (
    <div>
      <div className="animate-hero-rise">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
          Mon profil
        </h1>
        <p className="mt-2 max-w-md text-base leading-relaxed text-muted">
          Ce que voient tes voisins dans l’annuaire — sauf le n° de chambre,
          réservé à l’admin.
        </p>
      </div>

      <div className="animate-hero-rise-delay relative mt-8 overflow-hidden rounded-3xl border border-line bg-surface">
        <div
          className="h-24 bg-[radial-gradient(120%_120%_at_10%_0%,color-mix(in_oklab,var(--accent)_35%,transparent),transparent_55%),linear-gradient(135deg,#0c6b5c_0%,#1d4f7a_55%,#132029_100%)]"
          aria-hidden
        />
        <div className="relative -mt-12 px-5 pb-6 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <div className="animate-avatar-pop relative">
                <Avatar name={fullName} src={avatarUrl} size="xl" ring />
                <button
                  type="button"
                  disabled={avatarPending}
                  onClick={() => fileRef.current?.click()}
                  className="absolute -bottom-1 -right-1 inline-flex size-9 items-center justify-center rounded-xl border border-line bg-surface text-ink shadow-sm transition-[transform,background-color] hover:-translate-y-0.5 hover:bg-wash disabled:opacity-60"
                  aria-label="Changer la photo"
                >
                  <CameraIcon />
                </button>
              </div>
              <div className="min-w-0 pb-1">
                <p className="font-display text-xl font-semibold text-ink">
                  {fullName}
                </p>
                <p className="mt-1 truncate text-sm text-muted">{residenceName}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={avatarPending}
                onClick={() => fileRef.current?.click()}
                className="inline-flex h-10 items-center justify-center rounded-lg bg-ink px-4 text-sm font-semibold text-white transition-[opacity,transform] hover:-translate-y-0.5 hover:opacity-90 disabled:opacity-60"
              >
                {avatarPending
                  ? "Envoi…"
                  : avatarUrl
                    ? "Changer la photo"
                    : "Ajouter une photo"}
              </button>
              {avatarUrl ? (
                <button
                  type="button"
                  disabled={avatarPending}
                  onClick={onRemovePhoto}
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-line bg-surface px-4 text-sm font-semibold text-ink transition-colors hover:bg-wash disabled:opacity-60"
                >
                  Retirer
                </button>
              ) : null}
            </div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/jpg,.jpg,.jpeg,.png,.webp"
            className="hidden"
            onChange={onPickPhoto}
          />
          <p className="mt-4 text-xs text-muted">
            JPG, PNG ou WebP. Les grosses photos (téléphone) sont compressées
            automatiquement. HEIC iPhone non supporté.
          </p>
          {avatarError ? (
            <p className="mt-2 text-sm text-red-700" role="alert">
              {avatarError}
            </p>
          ) : null}
          {avatarSuccess ? (
            <p className="mt-2 text-sm font-medium text-accent">{avatarSuccess}</p>
          ) : null}
        </div>
      </div>

      <form
        onSubmit={onSubmit}
        className="animate-hero-rise-delay-2 mt-8 space-y-5"
        noValidate
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="firstName" className={labelClass}>
              Prénom
            </label>
            <input
              id="firstName"
              className={fieldClass}
              value={profile.firstName}
              onChange={(e) => update("firstName", e.target.value)}
            />
            {errors.firstName ? (
              <p className="mt-1.5 text-sm text-red-700">{errors.firstName}</p>
            ) : null}
          </div>
          <div>
            <label htmlFor="lastName" className={labelClass}>
              Nom
            </label>
            <input
              id="lastName"
              className={fieldClass}
              value={profile.lastName}
              onChange={(e) => update("lastName", e.target.value)}
            />
            {errors.lastName ? (
              <p className="mt-1.5 text-sm text-red-700">{errors.lastName}</p>
            ) : null}
          </div>
        </div>

        <div>
          <label htmlFor="email" className={labelClass}>
            E-mail
          </label>
          <input
            id="email"
            type="email"
            className={`${fieldClass} bg-wash text-muted`}
            value={profile.email}
            readOnly
          />
        </div>

        <div>
          <label htmlFor="school" className={labelClass}>
            École / université
          </label>
          <input
            id="school"
            className={fieldClass}
            value={profile.school}
            onChange={(e) => update("school", e.target.value)}
          />
          {errors.school ? (
            <p className="mt-1.5 text-sm text-red-700">{errors.school}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="fieldOfStudy" className={labelClass}>
            Domaine d’études
          </label>
          <input
            id="fieldOfStudy"
            className={fieldClass}
            value={profile.fieldOfStudy}
            onChange={(e) => update("fieldOfStudy", e.target.value)}
          />
          {errors.fieldOfStudy ? (
            <p className="mt-1.5 text-sm text-red-700">{errors.fieldOfStudy}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="interests" className={labelClass}>
            Centres d’intérêt
          </label>
          <input
            id="interests"
            className={fieldClass}
            placeholder="Ex. FIFA, cuisine, running"
            value={profile.interests}
            onChange={(e) => update("interests", e.target.value)}
          />
          <p className="mt-1.5 text-xs text-muted">
            Séparés par des virgules — visibles dans l’annuaire.
          </p>
        </div>

        <div>
          <label htmlFor="bio" className={labelClass}>
            Bio courte
          </label>
          <textarea
            id="bio"
            rows={3}
            className={`${fieldClass} resize-y`}
            value={profile.bio}
            onChange={(e) => update("bio", e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="roomNumber" className={labelClass}>
            Numéro de chambre{" "}
            <span className="font-normal text-muted">(optionnel)</span>
          </label>
          <input
            id="roomNumber"
            className={fieldClass}
            value={profile.roomNumber}
            onChange={(e) => update("roomNumber", e.target.value)}
          />
          <p className="mt-1.5 text-xs text-muted">
            Visible uniquement par l’admin de ta résidence — uniquement si tu
            veux l’aider. Pas obligatoire.
          </p>
          {errors.roomNumber ? (
            <p className="mt-1.5 text-sm text-red-700">{errors.roomNumber}</p>
          ) : null}
        </div>

        <div className="rounded-xl border border-line bg-wash/70 px-4 py-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 size-4 rounded border-line accent-[var(--accent)]"
              checked={profile.showNationality}
              onChange={(e) => {
                update("showNationality", e.target.checked);
                if (!e.target.checked) update("nationality", "");
              }}
            />
            <span>
              <span className="block text-sm font-medium text-ink">
                Afficher ma nationalité / origine dans l’annuaire
              </span>
            </span>
          </label>
          {profile.showNationality ? (
            <div className="mt-4">
              <label htmlFor="nationality" className={labelClass}>
                Nationalité / origine
              </label>
              <input
                id="nationality"
                className={fieldClass}
                value={profile.nationality}
                onChange={(e) => update("nationality", e.target.value)}
              />
              {errors.nationality ? (
                <p className="mt-1.5 text-sm text-red-700">{errors.nationality}</p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="rounded-xl border border-line bg-wash/70 px-4 py-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 size-4 rounded border-line accent-[var(--accent)]"
              checked={isAvailable}
              disabled={availabilityPending}
              onChange={(e) => onToggleAvailability(e.target.checked)}
            />
            <span>
              <span className="block text-sm font-medium text-ink">
                Je suis dispo pour discuter / sortir (7 jours)
              </span>
              <span className="mt-1 block text-xs text-muted">
                Opt-in visible dans l’annuaire. Tu peux le retirer à tout
                moment.
                {isAvailable && untilLabel
                  ? ` Actif jusqu’au ${untilLabel}.`
                  : ""}
              </span>
            </span>
          </label>
          {availabilityError ? (
            <p className="mt-3 text-sm text-red-700" role="alert">
              {availabilityError}
            </p>
          ) : null}
        </div>

        {formError ? (
          <p className="text-sm text-red-700" role="alert">
            {formError}
          </p>
        ) : null}

        {saved ? (
          <p className="rounded-lg border border-accent/20 bg-accent/5 px-4 py-3 text-sm font-medium text-accent">
            Profil enregistré. Visible dans l’annuaire pour tes voisins.
          </p>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex h-12 items-center justify-center rounded-lg bg-accent px-6 text-sm font-semibold text-white transition-[background-color,transform,opacity] hover:bg-accent-hover hover:-translate-y-0.5 disabled:opacity-60"
          >
            {isPending ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </form>

      <section className="mt-12 border-t border-line pt-10">
        <h3 className="font-display text-xl font-semibold text-ink">
          E-mail de connexion
        </h3>
        <p className="mt-2 text-sm text-muted">
          Change l’adresse utilisée pour te connecter. Confirme avec ton mot de
          passe actuel.
        </p>
        <div className="mt-6">
          <ChangeEmailForm
            currentEmail={profile.email}
            onEmailChanged={(email) =>
              setProfile((prev) => ({ ...prev, email }))
            }
          />
        </div>
      </section>

      <section className="mt-12 border-t border-line pt-10">
        <h3 className="font-display text-xl font-semibold text-ink">
          Mot de passe
        </h3>
        <p className="mt-2 text-sm text-muted">
          Change ton mot de passe de connexion. Tu resteras connecté après la
          mise à jour.
        </p>
        <div className="mt-6">
          <ChangePasswordForm />
        </div>
      </section>

      <p className="mt-6 text-center text-sm text-muted">
        <Link href="/accueil" className="hover:text-ink">
          Retour à l’accueil
        </Link>
      </p>
    </div>
  );
}

function CameraIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 8h3l2-2h6l2 2h3v11H4z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}
