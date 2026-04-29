import { z } from 'zod';

export const ParseJobSchema = z.object({
  jobTitle: z.string().optional(),
  companyName: z.string().optional(),
  location: z.string().optional(),
  salary: z.string().optional(),
  responsibilities: z.array(z.string()).default([]),
  requirements: z.array(z.string()).default([]),
  preferredQualifications: z.array(z.string()).default([]),
  keywords: z.array(z.string()).default([]),
  techStack: z.array(z.string()).default([]),
  experienceRequirement: z.string().optional(),
  educationRequirement: z.string().optional(),
  benefits: z.array(z.string()).default([]),
  category: z.string().optional(),
});

export type ParsedJob = z.infer<typeof ParseJobSchema>;
