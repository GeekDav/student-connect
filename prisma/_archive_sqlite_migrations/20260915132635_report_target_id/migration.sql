/*
  Warnings:

  - Added the required column `targetId` to the `ModerationReport` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ModerationReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "targetLabel" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "residenceId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    CONSTRAINT "ModerationReport_residenceId_fkey" FOREIGN KEY ("residenceId") REFERENCES "Residence" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ModerationReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ModerationReport" ("createdAt", "id", "reason", "reporterId", "residenceId", "status", "targetLabel", "targetType", "updatedAt") SELECT "createdAt", "id", "reason", "reporterId", "residenceId", "status", "targetLabel", "targetType", "updatedAt" FROM "ModerationReport";
DROP TABLE "ModerationReport";
ALTER TABLE "new_ModerationReport" RENAME TO "ModerationReport";
CREATE INDEX "ModerationReport_residenceId_status_idx" ON "ModerationReport"("residenceId", "status");
CREATE INDEX "ModerationReport_targetType_targetId_idx" ON "ModerationReport"("targetType", "targetId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
