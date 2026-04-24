import { z } from 'zod';

export const ValidateResumeSchema = z.object({
  isConsistent: z.boolean().describe('是否一致'),
  issues: z.array(z.string()).describe('发现的问题列表'),
  missingKeywords: z.array(z.string()).describe('缺少的岗位关键词'),
  possibleFabrications: z.array(z.string()).describe('可能虚构的内容'),
  suggestions: z.array(z.string()).describe('改进建议'),
});

export type ValidateResumeResult = z.infer<typeof ValidateResumeSchema>;