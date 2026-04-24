-- CreateTable
CREATE TABLE "resume_publish_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "versionId" TEXT NOT NULL,
    "publicToken" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "resume_publish_records_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "resume_versions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "resume_publish_records_publicToken_key" ON "resume_publish_records"("publicToken");

-- CreateIndex
CREATE INDEX "resume_publish_records_versionId_idx" ON "resume_publish_records"("versionId");
