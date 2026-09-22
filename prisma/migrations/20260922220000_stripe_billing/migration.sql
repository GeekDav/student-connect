-- AlterTable
ALTER TABLE "Residence" ADD COLUMN     "stripeCustomerId" TEXT,
ADD COLUMN     "stripeSubscriptionId" TEXT,
ADD COLUMN     "stripeSubscriptionStatus" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Residence_stripeCustomerId_key" ON "Residence"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "Residence_stripeSubscriptionId_key" ON "Residence"("stripeSubscriptionId");
