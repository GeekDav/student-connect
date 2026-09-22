-- CreateTable
CREATE TABLE "ResidenceInvitation" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT,
    "maxUses" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "residenceId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "ResidenceInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ResidenceInvitation_code_key" ON "ResidenceInvitation"("code");

-- CreateIndex
CREATE INDEX "ResidenceInvitation_residenceId_createdAt_idx" ON "ResidenceInvitation"("residenceId", "createdAt");

-- AddForeignKey
ALTER TABLE "ResidenceInvitation" ADD CONSTRAINT "ResidenceInvitation_residenceId_fkey" FOREIGN KEY ("residenceId") REFERENCES "Residence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResidenceInvitation" ADD CONSTRAINT "ResidenceInvitation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
