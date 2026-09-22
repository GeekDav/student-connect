import { randomBytes } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { del, put } from "@vercel/blob";

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const MAX_BYTES = 2 * 1024 * 1024;

export function isBlobConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

function isBlobUrl(url: string) {
  return (
    url.includes(".public.blob.vercel-storage.com") ||
    url.includes(".blob.vercel-storage.com")
  );
}

async function savePublicImage(
  file: File,
  folder: "avatars" | "announcements",
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    return {
      ok: false,
      error: "Formats acceptés : JPG, PNG ou WebP.",
    };
  }

  if (file.size <= 0 || file.size > MAX_BYTES) {
    return { ok: false, error: "Image trop lourde (max 2 Mo)." };
  }

  const filename = `${Date.now()}-${randomBytes(6).toString("hex")}.${ext}`;
  const pathname = `${folder}/${filename}`;

  if (isBlobConfigured()) {
    try {
      const blob = await put(pathname, file, {
        access: "public",
        contentType: file.type,
        addRandomSuffix: false,
      });
      return { ok: true, url: blob.url };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Échec upload Blob.";
      return { ok: false, error: message };
    }
  }

  // Fallback local (dev sans token) — ne persiste pas sur Vercel.
  const dir = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(dir, { recursive: true });
  const absolute = path.join(dir, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(absolute, buffer);
  return { ok: true, url: `/uploads/${folder}/${filename}` };
}

export async function saveAvatarFile(file: File) {
  return savePublicImage(file, "avatars");
}

export async function saveAnnouncementImage(file: File) {
  return savePublicImage(file, "announcements");
}

export async function deletePublicUpload(url: string | null | undefined) {
  if (!url) return;

  if (isBlobUrl(url)) {
    if (!isBlobConfigured()) return;
    try {
      await del(url);
    } catch {
      // ignore missing / already deleted
    }
    return;
  }

  if (!url.startsWith("/uploads/")) return;
  const absolute = path.join(process.cwd(), "public", url);
  try {
    await unlink(absolute);
  } catch {
    // ignore missing files
  }
}
