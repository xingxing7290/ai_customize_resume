import { z } from 'zod';

const StringArraySchema = z.preprocess((value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item) => (typeof item === 'string' ? item : JSON.stringify(item)));
  }
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).map(([key, val]) => `${key}: ${typeof val === 'string' ? val : JSON.stringify(val)}`);
  }
  return [String(value)];
}, z.array(z.string()).default([]));

export const GenerateResumeSchema = z.object({
  summary: z.string().optional(),
  skills: StringArraySchema,
  workExperiences: z.array(z.object({
    company: z.string().optional(),
    companyName: z.string().optional(),
    title: z.string().optional(),
    role: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    duration: z.string().optional(),
    description: z.string().optional(),
    highlights: StringArraySchema,
    techStack: StringArraySchema,
  })).default([]),
  projectExperiences: z.array(z.object({
    name: z.string().optional(),
    projectName: z.string().optional(),
    role: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    description: z.string().optional(),
    highlights: StringArraySchema,
    techStack: StringArraySchema,
  })).default([]),
  certificates: StringArraySchema,
  selfEvaluation: z.string().optional(),
  optimizationNotes: StringArraySchema,
  gapAnalysis: StringArraySchema,
});

export type GeneratedResume = z.infer<typeof GenerateResumeSchema>;
