import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Admin123!", 10);

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

  console.log("Seed OK — base propre pour test Alpha");
  console.log("Super-admin : admin@student-connect.local / Admin123!");
  console.log("Aucune résidence / gestionnaire préchargés — à créer via /super-admin");
  console.log("Super-admin id :", superAdmin.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
