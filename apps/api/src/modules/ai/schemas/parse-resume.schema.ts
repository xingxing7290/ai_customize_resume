import { z } from 'zod';

const EducationSchema = z.object({
  school: z.string().describe('学校名称'),
  degree: z.string().optional().describe('学位，如本科、硕士、博士'),
  major: z.string().optional().describe('专业'),
  startDate: z.string().optional().describe('开始日期，格式 YYYY-MM 或 YYYY'),
  endDate: z.string().optional().describe('结束日期，格式 YYYY-MM 或 YYYY'),
  gpa: z.string().optional().describe('GPA'),
  description: z.string().optional().describe('描述'),
});

const WorkExperienceSchema = z.object({
  company: z
    .string()
    .describe(
      '真实雇主/公司/组织名称，不能填写日期、学校、项目名、平台名或描述句',
    ),
  title: z.string().describe('任职职位名称'),
  location: z.string().optional().describe('工作地点'),
  startDate: z.string().optional().describe('开始日期，格式 YYYY-MM 或 YYYY'),
  endDate: z.string().optional().describe('结束日期，格式 YYYY-MM 或 YYYY'),
  isCurrent: z.boolean().optional().describe('是否当前工作'),
  description: z.string().optional().describe('工作描述'),
  highlights: z.string().optional().describe('工作亮点，逗号分隔'),
  techStack: z.string().optional().describe('技术栈，逗号分隔'),
});

const ProjectExperienceSchema = z.object({
  name: z
    .string()
    .describe('项目/平台/系统/产品名称，不能填写日期、页码、纯数字或描述句'),
  role: z
    .string()
    .optional()
    .describe('项目中的角色，如开发工程师、项目负责人'),
  startDate: z.string().optional().describe('开始日期'),
  endDate: z.string().optional().describe('结束日期'),
  description: z.string().optional().describe('项目描述'),
  highlights: z.string().optional().describe('项目亮点，逗号分隔'),
  techStack: z.string().optional().describe('技术栈，逗号分隔'),
  link: z.string().optional().describe('项目链接'),
});

const SkillSchema = z.object({
  name: z.string().describe('技能名称'),
  category: z
    .string()
    .optional()
    .describe('技能分类，如编程语言、框架、工具等'),
  level: z.string().optional().describe('技能等级，如精通、熟练、了解'),
});

const CertificateSchema = z.object({
  name: z.string().describe('证书名称'),
  issuer: z.string().optional().describe('颁发机构'),
  date: z.string().optional().describe('获得日期'),
  description: z.string().optional().describe('证书描述'),
  link: z.string().optional().describe('证书链接'),
});

export const ParseResumeSchema = z.object({
  name: z.string().optional().describe('姓名'),
  email: z.string().optional().describe('邮箱'),
  phone: z.string().optional().describe('电话'),
  location: z.string().optional().describe('地点'),
  summary: z.string().optional().describe('个人简介'),
  educationRecords: z.array(EducationSchema).optional().describe('教育经历'),
  workExperiences: z
    .array(WorkExperienceSchema)
    .optional()
    .describe('工作经历'),
  projectExperiences: z
    .array(ProjectExperienceSchema)
    .optional()
    .describe('项目经历'),
  skillRecords: z.array(SkillSchema).optional().describe('技能'),
  certificateRecords: z.array(CertificateSchema).optional().describe('证书'),
});
