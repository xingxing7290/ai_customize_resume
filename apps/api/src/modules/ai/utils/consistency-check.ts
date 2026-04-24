/**
 * AI 结果一致性检查工具
 * 用于验证 AI 生成的简历内容是否与用户原始资料一致
 */

interface ProfileData {
  skills: string[];
  projects: Array<{ name: string; techStack: string[] }>;
  workExperiences: Array<{ company: string; title: string }>;
  certificates: string[];
}

interface GeneratedResume {
  skills?: string[];
  workExperiences?: Array<{
    company: string;
    title: string;
    highlights?: string[];
  }>;
  projectExperiences?: Array<{
    name: string;
    techStack?: string[];
  }>;
  certificates?: string[];
}

interface ConsistencyResult {
  isConsistent: boolean;
  issues: string[];
  possibleFabrications: string[];
  warnings: string[];
}

/**
 * 检查 AI 生成结果的一致性
 */
export function checkConsistency(
  sourceProfile: ProfileData,
  generatedResume: GeneratedResume,
): ConsistencyResult {
  const issues: string[] = [];
  const possibleFabrications: string[] = [];
  const warnings: string[] = [];

  // 1. 检查技能
  if (generatedResume.skills && generatedResume.skills.length > 0) {
    const sourceSkills = new Set(sourceProfile.skills.map(s => s.toLowerCase()));
    for (const skill of generatedResume.skills) {
      if (!sourceSkills.has(skill.toLowerCase())) {
        possibleFabrications.push(`技能 "${skill}" 不在用户原始技能列表中`);
      }
    }
  }

  // 2. 检查项目经历
  if (generatedResume.projectExperiences && generatedResume.projectExperiences.length > 0) {
    const sourceProjects = new Set(sourceProfile.projects.map(p => p.name.toLowerCase()));
    const sourceTechStacks = new Set(
      sourceProfile.projects.flatMap(p => p.techStack.map(t => t.toLowerCase())),
    );

    for (const project of generatedResume.projectExperiences) {
      // 检查项目名称
      if (!sourceProjects.has(project.name.toLowerCase())) {
        possibleFabrications.push(`项目 "${project.name}" 不在用户原始项目列表中`);
      }

      // 检查技术栈
      if (project.techStack && project.techStack.length > 0) {
        for (const tech of project.techStack) {
          if (!sourceTechStacks.has(tech.toLowerCase())) {
            warnings.push(`项目 "${project.name}" 中的技术 "${tech}" 不在原始技术栈中`);
          }
        }
      }
    }
  }

  // 3. 检查工作经历
  if (generatedResume.workExperiences && generatedResume.workExperiences.length > 0) {
    const sourceCompanies = new Set(
      sourceProfile.workExperiences.map(w => w.company.toLowerCase()),
    );

    for (const work of generatedResume.workExperiences) {
      if (!sourceCompanies.has(work.company.toLowerCase())) {
        possibleFabrications.push(`公司 "${work.company}" 不在用户原始工作经历中`);
      }

      // 检查是否有可疑的量化指标
      if (work.highlights && work.highlights.length > 0) {
        for (const highlight of work.highlights) {
          const percentMatch = highlight.match(/(\d+)%/);
          if (percentMatch) {
            warnings.push(`发现量化指标 "${percentMatch[0]}"，请确认是否来自原始资料`);
          }
        }
      }
    }
  }

  // 4. 检查证书
  if (generatedResume.certificates && generatedResume.certificates.length > 0) {
    const sourceCerts = new Set(sourceProfile.certificates.map(c => c.toLowerCase()));
    for (const cert of generatedResume.certificates) {
      if (!sourceCerts.has(cert.toLowerCase())) {
        possibleFabrications.push(`证书 "${cert}" 不在用户原始证书列表中`);
      }
    }
  }

  const isConsistent = possibleFabrications.length === 0;

  return {
    isConsistent,
    issues,
    possibleFabrications,
    warnings,
  };
}

/**
 * 提取用户原始资料用于一致性检查
 */
export function extractProfileForCheck(profileData: any): ProfileData {
  return {
    skills: (profileData.skillRecords || []).map((s: any) => s.name),
    projects: (profileData.projectExperiences || []).map((p: any) => ({
      name: p.name,
      techStack: p.techStack || [],
    })),
    workExperiences: (profileData.workExperiences || []).map((w: any) => ({
      company: w.company,
      title: w.title,
    })),
    certificates: (profileData.certificateRecords || []).map((c: any) => c.name),
  };
}
