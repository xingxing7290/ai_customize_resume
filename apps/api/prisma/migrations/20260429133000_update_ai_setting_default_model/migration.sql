PRAGMA foreign_keys=OFF;

CREATE TABLE "new_user_ai_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'deepseek',
    "apiKey" TEXT NOT NULL,
    "baseUrl" TEXT NOT NULL DEFAULT 'https://api.deepseek.com',
    "model" TEXT NOT NULL DEFAULT 'deepseek-v4-flash',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "user_ai_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "new_user_ai_settings" ("id", "userId", "provider", "apiKey", "baseUrl", "model", "enabled", "createdAt", "updatedAt")
SELECT "id", "userId", "provider", "apiKey", "baseUrl", "model", "enabled", "createdAt", "updatedAt" FROM "user_ai_settings";

DROP TABLE "user_ai_settings";
ALTER TABLE "new_user_ai_settings" RENAME TO "user_ai_settings";

CREATE UNIQUE INDEX "user_ai_settings_userId_key" ON "user_ai_settings"("userId");
CREATE INDEX "user_ai_settings_userId_idx" ON "user_ai_settings"("userId");

PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
