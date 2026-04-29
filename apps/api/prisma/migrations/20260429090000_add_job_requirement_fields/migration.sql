-- Add structured fields extracted from job pages.
ALTER TABLE "job_targets" ADD COLUMN "parsedExperienceRequirement" TEXT;
ALTER TABLE "job_targets" ADD COLUMN "parsedEducationRequirement" TEXT;
