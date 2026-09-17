-- AlterTable
ALTER TABLE "User" ADD COLUMN "availableUntil" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "WallNote" (
    "id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "residenceId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,

    CONSTRAINT "WallNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WallNote_residenceId_createdAt_idx" ON "WallNote"("residenceId", "createdAt");

-- CreateIndex
CREATE INDEX "WallNote_authorId_createdAt_idx" ON "WallNote"("authorId", "createdAt");

-- AddForeignKey
ALTER TABLE "WallNote" ADD CONSTRAINT "WallNote_residenceId_fkey" FOREIGN KEY ("residenceId") REFERENCES "Residence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WallNote" ADD CONSTRAINT "WallNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
