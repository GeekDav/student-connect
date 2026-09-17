-- CreateTable
CREATE TABLE "WallNoteReply" (
    "id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "noteId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,

    CONSTRAINT "WallNoteReply_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WallNoteReply_noteId_createdAt_idx" ON "WallNoteReply"("noteId", "createdAt");

-- CreateIndex
CREATE INDEX "WallNoteReply_authorId_createdAt_idx" ON "WallNoteReply"("authorId", "createdAt");

-- AddForeignKey
ALTER TABLE "WallNoteReply" ADD CONSTRAINT "WallNoteReply_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "WallNote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WallNoteReply" ADD CONSTRAINT "WallNoteReply_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
