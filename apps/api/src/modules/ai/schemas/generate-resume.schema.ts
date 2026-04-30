import { z } from 'zod';

const StringArraySchema = z.preprocess((value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item) => formatListItem(item)).filter(Boolean);
  }
  if (typeof value === 'object') {
    return [formatListItem(value)].filter(Boolean);
  }
  return [String(value)];
}, z.array(z.string()).default([]));

function formatListItem(value: unknown) {
  if (!value) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value !== 'object') return String(value).trim();

  const item = value as Record<string, unknown>;
  const name = stringValue(item.name || item.title || item.certificate || item.award || item.certName);
  const authority = stringValue(item.authority || item.issuer || item.organization || item.org);
  const date = stringValue(item.date || item.issueDate || item.time);
  const description = stringValue(item.description || item.desc || item.detail);
  const link = stringValue(item.link || item.url);
  const main = [name, authority, date].filter(Boolean).join(' · ');
  const detail = [description, link].filter(Boolean).join(' · ');
  if (main && detail) return `${main}：${detail}`;
  if (main) return main;
  if (detail) return detail;
  return Object.entries(item)
    .map(([key, val]) => `${key}: ${stringValue(val)}`)
    .filter(Boolean)
    .join(' · ');
}

function stringValue(value: unknown) {
  if (!value) return '';
  return typeof value === 'string' ? value.trim() : String(value).trim();
}

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
