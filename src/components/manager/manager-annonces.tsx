"use client";

import {
  useRef,
  useState,
  useTransition,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { ViewAnnouncementImage } from "@/components/ui/view-announcement-image";
import { EmptyState } from "@/components/ui/empty-state";
import {
  createAnnouncement,
  unpublishAnnouncement,
  type AnnouncementItem,
} from "@/lib/actions/announcements";

const fieldClass =
  "mt-2 w-full rounded-lg border border-line bg-surface px-3.5 py-3 text-[15px] text-ink outline-none transition-[border-color,box-shadow] placeholder:text-muted/70 focus:border-accent focus:shadow-[0_0_0_3px_rgba(12,107,92,0.12)]";

const labelClass = "block text-sm font-medium text-ink";

export function ManagerAnnonces({
  initialItems,
}: {
  initialItems: AnnouncementItem[];
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState(initialItems);
  const [mode, setMode] = useState<"list" | "create">("list");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<{ title?: string; body?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function clearImage() {
    setImageFile(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  function onPickImage(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
  }

  function onCreate(e: FormEvent) {
    e.preventDefault();
    const next: { title?: string; body?: string } = {};
    if (!title.trim()) next.title = "Titre requis.";
    if (!body.trim()) next.body = "Contenu requis.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const formData = new FormData();
    formData.set("title", title);
    formData.set("body", body);
    if (imageFile) formData.set("image", imageFile);

    setFormError(null);
    startTransition(async () => {
      const result = await createAnnouncement(formData);
      if (!result.ok) {
        setFormError(result.error);
        return;
      }
      if (result.item) {
        setItems((prev) => [result.item!, ...prev]);
      }
      setTitle("");
      setBody("");
      clearImage();
      setMode("list");
    });
  }

  function onUnpublish(id: string) {
    setFormError(null);
    startTransition(async () => {
      const result = await unpublishAnnouncement(id);
      if (!result.ok) {
        setFormError(result.error);
        return;
      }
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, published: false } : item,
        ),
      );
    });
  }

  if (mode === "create") {
    return (
      <div>
        <button
          type="button"
          onClick={() => {
            clearImage();
            setMode("list");
          }}
          className="text-sm font-medium text-muted transition-colors hover:text-ink"
        >
          ← Retour aux annonces
        </button>
        <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-ink">
          Nouvelle annonce
        </h2>
        <p className="mt-2 text-base text-muted">
          Texte + image optionnelle. L’image s’ouvre en grand au clic « Voir
          l’image », sans casser le fil.
        </p>

        <form onSubmit={onCreate} className="mt-8 space-y-5" noValidate>
          <div>
            <label htmlFor="title" className={labelClass}>
              Titre
            </label>
            <input
              id="title"
              className={fieldClass}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            {errors.title ? (
              <p className="mt-1.5 text-sm text-red-700">{errors.title}</p>
            ) : null}
          </div>
          <div>
            <label htmlFor="body" className={labelClass}>
              Contenu
            </label>
            <textarea
              id="body"
              rows={5}
              className={`${fieldClass} resize-y`}
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
            {errors.body ? (
              <p className="mt-1.5 text-sm text-red-700">{errors.body}</p>
            ) : null}
          </div>

          <div>
            <p className={labelClass}>Image (optionnel)</p>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={onPickImage}
            />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="inline-flex h-11 items-center rounded-lg border border-line bg-surface px-4 text-sm font-semibold text-ink transition-colors hover:bg-wash"
              >
                {imageFile ? "Changer l’image" : "Joindre une image"}
              </button>
              {imageFile ? (
                <>
                  <span className="max-w-[14rem] truncate text-sm text-muted">
                    {imageFile.name}
                  </span>
                  <button
                    type="button"
                    onClick={clearImage}
                    className="text-sm font-semibold text-muted hover:text-ink"
                  >
                    Retirer
                  </button>
                </>
              ) : null}
            </div>
            <p className="mt-1.5 text-xs text-muted">
              JPG, PNG ou WebP · max 2 Mo
            </p>
          </div>

          {formError ? (
            <p className="text-sm text-red-700" role="alert">
              {formError}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex h-12 items-center rounded-lg bg-accent px-6 text-sm font-semibold text-white transition-[background-color,transform,opacity] hover:bg-accent-hover hover:-translate-y-0.5 disabled:opacity-60"
          >
            {isPending ? "Publication…" : "Publier"}
          </button>
        </form>
      </div>
    );
  }

  const published = items.filter((item) => item.published);
  const drafts = items.filter((item) => !item.published);

  return (
    <div>
      <div className="animate-hero-rise flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-ink">
            Annonces
          </h2>
          <p className="mt-2 max-w-xl text-base leading-relaxed text-muted">
            Remplace le tableau d’affichage du hall : infos officielles,
            coupures, soirées résidence.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setMode("create")}
          className="inline-flex h-11 shrink-0 items-center rounded-lg bg-accent px-5 text-sm font-semibold text-white transition-[background-color,transform] hover:bg-accent-hover hover:-translate-y-0.5"
        >
          Publier
        </button>
      </div>

      {formError ? (
        <p className="mt-6 text-sm text-red-700" role="alert">
          {formError}
        </p>
      ) : null}

      <section className="animate-hero-rise-delay mt-10">
        <h3 className="font-display text-sm font-semibold tracking-wide text-ink">
          Publiées · {published.length}
        </h3>
        {published.length === 0 ? (
          <div className="mt-2">
            <EmptyState
              title="Aucune annonce publiée"
              description="Publie une info officielle (travaux, règles, événement) — elle apparaît sur l’accueil des étudiants."
              action={
                <button
                  type="button"
                  onClick={() => setMode("create")}
                  className="inline-flex h-10 items-center rounded-lg bg-accent px-4 text-sm font-semibold text-white transition-[background-color,transform] hover:bg-accent-hover hover:-translate-y-0.5"
                >
                  Nouvelle annonce
                </button>
              }
            />
          </div>
        ) : (
          <ul className="mt-2 divide-y divide-line border-y border-line">
            {published.map((item) => (
              <li key={item.id} className="py-6">
                <p className="text-xs font-semibold text-accent">Officiel</p>
                <h4 className="mt-2 font-display text-lg font-semibold text-ink">
                  {item.title}
                </h4>
                <p className="mt-2 text-base leading-relaxed text-muted">
                  {item.body}
                </p>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-xs text-muted">{item.publishedAt}</p>
                    {item.imageUrl ? (
                      <ViewAnnouncementImage
                        src={item.imageUrl}
                        title={item.title}
                      />
                    ) : null}
                  </div>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => onUnpublish(item.id)}
                    className="text-sm font-semibold text-muted transition-colors hover:text-ink disabled:opacity-60"
                  >
                    Retirer
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {drafts.length > 0 ? (
        <section className="mt-12">
          <h3 className="font-display text-sm font-semibold tracking-wide text-muted">
            Retirées · {drafts.length}
          </h3>
          <ul className="mt-2 divide-y divide-line border-y border-line opacity-75">
            {drafts.map((item) => (
              <li key={item.id} className="py-4">
                <p className="font-medium text-ink">{item.title}</p>
                <p className="mt-1 text-xs text-muted">{item.publishedAt}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
