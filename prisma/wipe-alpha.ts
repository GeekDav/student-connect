/**
 * Vide toutes les données « pilote / test » (résidences, étudiants, contenus, mails logués)
 * en gardant au minimum les comptes SUPER_ADMIN (+ réinitialisation optionnelle du seed admin).
 *
 * Usage prod (Neon) :
 *   CONFIRM_WIPE=yes DATABASE_URL="…" DIRECT_URL="…" npm run db:wipe-alpha
 *
 * Optionnel :
 *   SEED_ADMIN_PASSWORD="…"  — mot de passe du compte seed après wipe
 *   KEEP_SUPER_ADMIN_EMAIL="a@b.c,d@e.f" — ne supprime que les autres users (défaut : garde TOUS les SUPER_ADMIN)
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

function requireConfirm() {
  if (process.env.CONFIRM_WIPE?.trim().toLowerCase() !== "yes") {
    console.error(
      "Refusé : définis CONFIRM_WIPE=yes pour confirmer le vidage de la base.",
    );
    process.exit(1);
  }
  if (!process.env.DATABASE_URL?.trim()) {
    console.error("DATABASE_URL manquant.");
    process.exit(1);
  }
}

async function wipeContent() {
  await prisma.$transaction(
    async (tx) => {
      await tx.message.deleteMany();
      await tx.conversation.deleteMany();
      await tx.eventParticipant.deleteMany();
      await tx.microEvent.deleteMany();
      await tx.sosHelp.deleteMany();
      await tx.sosRequest.deleteMany();
      await tx.marketplaceInterest.deleteMany();
      await tx.marketplaceItem.deleteMany();
      await tx.announcementRead.deleteMany();
      await tx.officialAnnouncement.deleteMany();
      await tx.wallNoteReply.deleteMany();
      await tx.wallNote.deleteMany();
      await tx.moderationReport.deleteMany();
      await tx.residenceInvitation.deleteMany();
      await tx.residenceMembership.deleteMany();

      await tx.residence.updateMany({ data: { managerId: null } });
      await tx.residence.deleteMany();
      await tx.emailLog.deleteMany();

      const keepList = process.env.KEEP_SUPER_ADMIN_EMAIL?.split(/[,;]/)
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);

      if (keepList?.length) {
        await tx.user.deleteMany({
          where: { email: { notIn: keepList } },
        });
      } else {
        await tx.user.deleteMany({
          where: { role: { not: Role.SUPER_ADMIN } },
        });
      }
    },
    { timeout: 120_000 },
  );
}

async function ensureSeedSuperAdmin() {
  const password = process.env.SEED_ADMIN_PASSWORD?.trim() || "Admin123!";
  const passwordHash = await bcrypt.hash(password, 10);

  const superAdmin = await prisma.user.upsert({
    where: { email: "admin@student-connect.local" },
    update: {
      passwordHash,
      firstName: "David",
      lastName: "Admin",
      role: Role.SUPER_ADMIN,
    },
    create: {
      email: "admin@student-connect.local",
      passwordHash,
      firstName: "David",
      lastName: "Admin",
      role: Role.SUPER_ADMIN,
    },
  });

  return { superAdmin, password };
}

async function main() {
  requireConfirm();

  const url = process.env.DATABASE_URL!;
  const hostHint = url.includes("neon")
    ? "Neon (prod)"
    : url.includes("localhost")
      ? "local"
      : "autre";

  console.log(`Wipe alpha — cible : ${hostHint}`);
  console.log("Suppression : résidences, comptes non super-admin, contenus, email logs…");

  await wipeContent();
  const { superAdmin, password } = await ensureSeedSuperAdmin();

  const remainingAdmins = await prisma.user.findMany({
    where: { role: Role.SUPER_ADMIN },
    select: { email: true, id: true },
  });

  console.log("\nWipe terminé.");
  console.log("Super-admins restants :", remainingAdmins.map((u) => u.email).join(", ") || "(aucun)");
  console.log("Compte seed garanti : admin@student-connect.local");
  console.log("Mot de passe seed (si pas de SEED_ADMIN_PASSWORD) :", password);
  console.log("Super-admin id :", superAdmin.id);
  console.log(
    "\nNote : les fichiers sur Vercel Blob (avatars, images) ne sont pas supprimés par ce script.",
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });