import { z } from 'zod';

export const GenerateResumeSchema = z.object({
  summary: z.string().optional(),
  skills: z.array(z.string()).default([]),
  workExperiences: z.array(z.object({
    companyName: z.string(),
    title: z.string(),
    duration: z.string(),
    highlights: z.array(z.string()).default([]),
  })).default([]),
  projectExperiences: z.array(z.object({
    projectName: z.string(),
    role: z.string().optional(),
    description: z.string().optional(),
    highlights: z.array(z.string()).default([]),
    techStack: z.array(z.string()).default([]),
  })).default([]),
  certificates: z.array(z.string()).default([]),
  selfEvaluation: z.string().optional(),
  optimizationNotes: z.array(z.string()).default([]),
  gapAnalysis: z.array(z.string()).default([]),
});

export type GeneratedResume = z.infer<typeof GenerateResumeSchema>;
