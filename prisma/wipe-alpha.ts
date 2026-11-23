/**
 * Remise à zéro : tout supprimer sauf UN compte super-admin.
 *
 * Prod :
 *   CONFIRM_WIPE=yes DATABASE_URL="…" DIRECT_URL="…" npm run db:wipe-alpha
 *
 * Garder ton compte (défaut seed) :
 *   KEEP_ADMIN_EMAIL=admin@student-connect.local  (défaut)
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_ADMIN_EMAIL = "admin@student-connect.local";

function requireConfirm() {
  if (process.env.CONFIRM_WIPE?.trim().toLowerCase() !== "yes") {
    console.error("Refusé : CONFIRM_WIPE=yes requis.");
    process.exit(1);
  }
  if (!process.env.DATABASE_URL?.trim()) {
    console.error("DATABASE_URL manquant.");
    process.exit(1);
  }
}

async function wipeAll() {
  const keepEmail = (
    process.env.KEEP_ADMIN_EMAIL?.trim().toLowerCase() || DEFAULT_ADMIN_EMAIL
  ).toLowerCase();

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

      await tx.user.deleteMany({
        where: { email: { not: keepEmail } },
      });
    },
    { timeout: 120_000 },
  );

  const password = process.env.SEED_ADMIN_PASSWORD?.trim() || "Admin123!";
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { email: keepEmail },
    update: {
      passwordHash,
      firstName: "David",
      lastName: "Admin",
      role: Role.SUPER_ADMIN,
    },
    create: {
      email: keepEmail,
      passwordHash,
      firstName: "David",
      lastName: "Admin",
      role: Role.SUPER_ADMIN,
    },
  });

  return { keepEmail, password };
}

async function main() {
  requireConfirm();
  const { keepEmail, password } = await wipeAll();
  console.log("OK — base à zéro.");
  console.log("Admin :", keepEmail);
  if (!process.env.SEED_ADMIN_PASSWORD) {
    console.log("Mot de passe (défaut) :", password);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });