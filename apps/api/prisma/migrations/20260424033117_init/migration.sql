-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "avatar" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "resume_profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "location" TEXT,
    "website" TEXT,
    "github" TEXT,
    "linkedin" TEXT,
    "summary" TEXT,
    "selfEvaluation" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "resume_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "education_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "school" TEXT NOT NULL,
    "degree" TEXT NOT NULL,
    "major" TEXT,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT,
    "gpa" TEXT,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "education_records_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "resume_profiles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "work_experiences" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "location" TEXT,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "highlights" TEXT,
    "techStack" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "work_experiences_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "resume_profiles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "project_experiences" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "startDate" TEXT,
    "endDate" TEXT,
    "description" TEXT,
    "highlights" TEXT,
    "techStack" TEXT,
    "link" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "project_experiences_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "resume_profiles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "skill_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "level" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "skill_records_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "resume_profiles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "certificate_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "issuer" TEXT,
    "date" TEXT,
    "description" TEXT,
    "link" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "certificate_records_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "resume_profiles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "job_targets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "rawJdText" TEXT,
    "status" TEXT NOT NULL DEFAULT 'INIT',
    "parsedJobTitle" TEXT,
    "parsedCompanyName" TEXT,
    "parsedLocation" TEXT,
    "parsedResponsibilities" TEXT,
    "parsedRequirements" TEXT,
    "parsedTechStack" TEXT,
    "parsedSalary" TEXT,
    "parsedBenefits" TEXT,
    "parseError" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "job_targets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "resume_versions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "jobTargetId" TEXT,
    "sourceVersionId" TEXT,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "contentSummary" TEXT,
    "contentSkills" TEXT,
    "contentWorkExperiences" TEXT,
    "contentProjectExperiences" TEXT,
    "contentCertificates" TEXT,
    "contentSelfEvaluation" TEXT,
    "aiOptimizationNotes" TEXT,
    "aiGapAnalysis" TEXT,
    "publishedUrl" TEXT,
    "pdfPath" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "resume_versions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "resume_versions_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "resume_profiles" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "resume_versions_jobTargetId_fkey" FOREIGN KEY ("jobTargetId") REFERENCES "job_targets" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "resume_profiles_userId_idx" ON "resume_profiles"("userId");

-- CreateIndex
CREATE INDEX "education_records_profileId_idx" ON "education_records"("profileId");

-- CreateIndex
CREATE INDEX "work_experiences_profileId_idx" ON "work_experiences"("profileId");

-- CreateIndex
CREATE INDEX "project_experiences_profileId_idx" ON "project_experiences"("profileId");

-- CreateIndex
CREATE INDEX "skill_records_profileId_idx" ON "skill_records"("profileId");

-- CreateIndex
CREATE INDEX "certificate_records_profileId_idx" ON "certificate_records"("profileId");

-- CreateIndex
CREATE INDEX "job_targets_userId_idx" ON "job_targets"("userId");

-- CreateIndex
CREATE INDEX "resume_versions_userId_idx" ON "resume_versions"("userId");

-- CreateIndex
CREATE INDEX "resume_versions_profileId_idx" ON "resume_versions"("profileId");

-- CreateIndex
CREATE INDEX "resume_versions_jobTargetId_idx" ON "resume_versions"("jobTargetId");
