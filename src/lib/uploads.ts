import { randomBytes } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { del, put } from "@vercel/blob";

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
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
    url.includes(".private.blob.vercel-storage.com") ||
    url.includes(".blob.vercel-storage.com")
  );
}

/** Sniffe le vrai format (mobile envoie parfois type vide / image/jpg). */
function sniffImageExt(bytes: Uint8Array): string | null {
  if (bytes.length < 12) return null;
  // JPEG
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
  // PNG
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "png";
  }
  // WebP : RIFF....WEBP
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "webp";
  }
  // HEIC/HEIF ftyp
  if (
    bytes[4] === 0x66 &&
    bytes[5] === 0x74 &&
    bytes[6] === 0x79 &&
    bytes[7] === 0x70
  ) {
    const brand = String.fromCharCode(
      bytes[8],
      bytes[9],
      bytes[10],
      bytes[11],
    );
    if (/heic|heif|mif1|msf1/i.test(brand)) return "heic";
  }
  return null;
}

function contentTypeForExt(ext: string) {
  switch (ext) {
    case "jpg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    default:
      return "application/octet-stream";
  }
}

async function savePublicImage(
  file: File,
  folder: "avatars" | "announcements",
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  if (file.size <= 0 || file.size > MAX_BYTES) {
    return { ok: false, error: "Image trop lourde (max 2 Mo)." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const sniffed = sniffImageExt(new Uint8Array(buffer.subarray(0, 16)));

  if (sniffed === "heic") {
    return {
      ok: false,
      error:
        "Format HEIC (iPhone) non supporté. Exporte en JPG ou active « Le plus compatible » dans Réglages photo.",
    };
  }

  const fromMime = ALLOWED_TYPES[file.type.toLowerCase()] ?? null;
  const ext = sniffed ?? fromMime;
  if (!ext || !["jpg", "png", "webp"].includes(ext)) {
    return {
      ok: false,
      error: "Formats acceptés : JPG, PNG ou WebP.",
    };
  }

  const contentType = contentTypeForExt(ext);
  const filename = `${Date.now()}-${randomBytes(6).toString("hex")}.${ext}`;
  const pathname = `${folder}/${filename}`;

  if (isBlobConfigured()) {
    try {
      const blob = await put(pathname, buffer, {
        access: "public",
        contentType,
        addRandomSuffix: false,
      });
      return { ok: true, url: blob.url };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Échec upload Blob.";
      // Store privé : access public est refusé
      if (/private|access/i.test(message)) {
        return {
          ok: false,
          error:
            "Stockage Blob mal configuré (doit être Public). Vérifie le store Vercel Blob.",
        };
      }
      return { ok: false, error: message };
    }
  }

  // Fallback local (dev sans token) — ne persiste pas sur Vercel.
  const dir = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(dir, { recursive: true });
  const absolute = path.join(dir, filename);
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
