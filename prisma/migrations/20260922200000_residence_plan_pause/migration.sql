-- CreateEnum
CREATE TYPE "ResidencePlanType" AS ENUM ('PILOT', 'PAID');

-- AlterTable
ALTER TABLE "Residence" ADD COLUMN "planType" "ResidencePlanType" NOT NULL DEFAULT 'PILOT';
ALTER TABLE "Residence" ADD COLUMN "pausedAt" TIMESTAMP(3);
ALTER TABLE "Residence" ADD COLUMN "retainUntil" TIMESTAMP(3);
