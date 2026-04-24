-- CreateTable
CREATE TABLE "ai_task_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "taskType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "requestPayload" TEXT,
    "responsePayload" TEXT,
    "errorMessage" TEXT,
    "tokenUsed" INTEGER,
    "durationMs" INTEGER,
    "relatedEntityId" TEXT,
    "relatedEntityType" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "ai_task_logs_userId_idx" ON "ai_task_logs"("userId");

-- CreateIndex
CREATE INDEX "ai_task_logs_taskType_idx" ON "ai_task_logs"("taskType");
