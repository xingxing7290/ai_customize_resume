-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_resume_publish_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "versionId" TEXT NOT NULL,
    "publicToken" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "resume_publish_records_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "resume_versions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_resume_publish_records" ("createdAt", "id", "isPublic", "publicToken", "updatedAt", "versionId") SELECT "createdAt", "id", "isPublic", "publicToken", "updatedAt", "versionId" FROM "resume_publish_records";
DROP TABLE "resume_publish_records";
ALTER TABLE "new_resume_publish_records" RENAME TO "resume_publish_records";
CREATE UNIQUE INDEX "resume_publish_records_publicToken_key" ON "resume_publish_records"("publicToken");
CREATE INDEX "resume_publish_records_versionId_idx" ON "resume_publish_records"("versionId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
