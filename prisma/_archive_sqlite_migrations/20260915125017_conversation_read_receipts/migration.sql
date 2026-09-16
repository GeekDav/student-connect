-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Conversation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userALastReadAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userBLastReadAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "residenceId" TEXT NOT NULL,
    "userAId" TEXT NOT NULL,
    "userBId" TEXT NOT NULL,
    CONSTRAINT "Conversation_residenceId_fkey" FOREIGN KEY ("residenceId") REFERENCES "Residence" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Conversation_userAId_fkey" FOREIGN KEY ("userAId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Conversation_userBId_fkey" FOREIGN KEY ("userBId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Conversation" ("createdAt", "id", "residenceId", "updatedAt", "userAId", "userBId") SELECT "createdAt", "id", "residenceId", "updatedAt", "userAId", "userBId" FROM "Conversation";
DROP TABLE "Conversation";
ALTER TABLE "new_Conversation" RENAME TO "Conversation";
CREATE INDEX "Conversation_userAId_idx" ON "Conversation"("userAId");
CREATE INDEX "Conversation_userBId_idx" ON "Conversation"("userBId");
CREATE UNIQUE INDEX "Conversation_residenceId_userAId_userBId_key" ON "Conversation"("residenceId", "userAId", "userBId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
