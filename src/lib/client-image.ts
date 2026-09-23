/**
 * Prépare une image avant upload (surtout mobile : photos 5–12 Mo).
 * Redimensionne + recompresse en JPEG pour rester sous la limite Server Action.
 */

const HEIC_TYPES = new Set([
  "image/heic",
  "image/heif",
  "image/heic-sequence",
  "image/heif-sequence",
]);

export type PrepareImageOptions = {
  /** Côté long max en px (avatar ~960, annonce ~1600). */
  maxEdge?: number;
  /** Taille cible max du fichier final (bytes). */
  maxBytes?: number;
  /** Qualité JPEG de départ (0–1). */
  quality?: number;
};

export type PrepareImageResult =
  | { ok: true; file: File; wasProcessed: boolean }
  | { ok: false; error: string };

function looksLikeHeic(file: File) {
  if (HEIC_TYPES.has(file.type.toLowerCase())) return true;
  const name = file.name.toLowerCase();
  return name.endsWith(".heic") || name.endsWith(".heif");
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}

async function loadImageBitmap(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file);
  } catch {
    // Fallback : certains navigateurs mobile échouent sans object URL
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error("decode"));
        el.src = url;
      });
      return await createImageBitmap(img);
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

/**
 * Convertit / compresse une photo pour upload fiable sur Vercel.
 * Les HEIC iPhone ne sont pas décodables dans la plupart des navigateurs.
 */
export async function prepareImageForUpload(
  file: File,
  options: PrepareImageOptions = {},
): Promise<PrepareImageResult> {
  if (!file || file.size <= 0) {
    return { ok: false, error: "Choisis une image." };
  }

  if (looksLikeHeic(file)) {
    return {
      ok: false,
      error:
        "Les photos iPhone en HEIC ne passent pas. Choisis JPG/PNG, ou dans Réglages → Appareil photo → Formats → « Le plus compatible ».",
    };
  }

  const maxEdge = options.maxEdge ?? 1600;
  const maxBytes = options.maxBytes ?? 1.5 * 1024 * 1024;
  let quality = options.quality ?? 0.82;

  // Déjà petit + type OK : envoi tel quel (évite recompression inutile)
  const type = (file.type || "").toLowerCase();
  const typeOk =
    type === "image/jpeg" ||
    type === "image/jpg" ||
    type === "image/png" ||
    type === "image/webp";
  if (typeOk && file.size <= maxBytes) {
    return { ok: true, file, wasProcessed: false };
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await loadImageBitmap(file);
  } catch {
    return {
      ok: false,
      error:
        "Impossible de lire cette image. Réessaie en JPG ou PNG (évite HEIC / fichiers corrompus).",
    };
  }

  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return { ok: false, error: "Compression impossible sur cet appareil." };
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  let blob: Blob | null = null;
  for (let attempt = 0; attempt < 6; attempt++) {
    blob = await canvasToBlob(canvas, "image/jpeg", quality);
    if (!blob) break;
    if (blob.size <= maxBytes) break;
    quality -= 0.1;
    if (quality < 0.45) break;
  }

  if (!blob || blob.size <= 0) {
    return { ok: false, error: "Échec de la compression de l’image." };
  }

  if (blob.size > maxBytes) {
    return {
      ok: false,
      error:
        "Image encore trop lourde après compression. Essaie une photo moins grande.",
    };
  }

  const base =
    file.name.replace(/\.[^.]+$/, "").replace(/[^\w\-]+/g, "_").slice(0, 40) ||
    "photo";
  const out = new File([blob], `${base}.jpg`, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });

  return { ok: true, file: out, wasProcessed: true };
}

/** Message lisible quand la Server Action plante (payload trop gros, réseau…). */
export function uploadTransportError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err ?? "");
  if (
    /body|payload|too large|413|Body exceeded|Failed to find Server Action/i.test(
      msg,
    )
  ) {
    return "L’image est trop lourde pour l’envoi. Réessaie — on la compresse automatiquement.";
  }
  if (/fetch|network|Failed to fetch/i.test(msg)) {
    return "Connexion interrompue pendant l’envoi. Réessaie.";
  }
  return "Échec de l’envoi. Réessaie dans un instant.";
}
