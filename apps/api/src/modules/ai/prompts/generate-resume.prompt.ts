function toList(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(/\r?\n|,|，|;|；|、/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [String(value).trim()].filter(Boolean);
}

function joinList(value: unknown) {
  return toList(value).join('、') || '未提供';
}

export const GENERATE_RESUME_SYSTEM_PROMPT = `你是一个专业的简历优化助手。

你的任务是根据目标岗位要求，从候选人提供的主档案中筛选、重组、润色内容，生成一份更匹配该岗位的定制简历。

核心规则：
1. 只能使用候选人已提供的事实，不允许虚构经历、公司、项目、证书或量化指标。
2. 不允许新增项目经历，只能从现有项目中选择和重组。
3. 不允许新增技能，只能从现有技能、项目技术栈和工作技术栈中选择表达。
4. 可优化表达方式和顺序，但不能改变事实。
5. 优先突出与岗位职责、技术栈、经验要求、学历要求最匹配的经历和项目。
6. 不匹配或缺失的要求写入 gapAnalysis，不要凭空补齐。
7. 输出必须是合法 JSON，字段必须符合调用方提供的 JSON Schema。
8. 只输出紧凑 JSON，不要输出 Markdown、解释文字或代码块。
9. workExperiences 和 projectExperiences 是简历核心内容，不能留空；必须从候选人已有工作经历和项目经历中选择、排序、重写重点。
10. 可以按岗位要求改写每段工作/项目的 description、highlights、techStack 排序，但不能改变公司、项目名称、时间、真实职责和真实成果。

优化策略：
- 根据岗位关键词调整技能顺序。
- 工作经历突出与岗位最相关的职责、协议、平台、工具和调试经验。
- 项目经历优先选择能证明岗位能力的项目。
- 对每个岗位至少输出 1 段工作经历和 1 个项目经历；如果候选人有多段相关经历，优先输出 2 段。
- 每段工作经历输出 company/companyName、title、startDate、endDate、description、highlights、techStack。
- 每个项目经历输出 name/projectName、role、startDate、endDate、description、highlights、techStack。
- 压缩与岗位无关的内容。
- 语言保持专业、简洁、面向招聘筛选。`;

export const buildGenerateResumeUserPrompt = (
  profileData: any,
  jobData: any,
) => `## 目标岗位信息
- 岗位名称：${jobData.jobTitle || '未知'}
- 公司名称：${jobData.companyName || '未知'}
- 薪资待遇：${jobData.salary || '未知'}
- 经验要求：${jobData.experienceRequirement || '未知'}
- 学历要求：${jobData.educationRequirement || '未知'}
- 核心技能要求：${joinList(jobData.techStack)}
- 福利待遇：${joinList(jobData.benefits)}
- 岗位职责：${joinList(jobData.responsibilities)}
- 任职要求：${joinList(jobData.requirements)}

## 候选人主档案

### 基本信息
- 姓名：${profileData.name || '未提供'}
- 邮箱：${profileData.email || '未提供'}
- 所在地：${profileData.location || '未提供'}
- 概述：${profileData.summary || '未提供'}
- 自我评价：${profileData.selfEvaluation || '未提供'}

### 技能列表
${(profileData.skillRecords || []).map((s: any) => `- ${s.name}${s.category ? `（${s.category}）` : ''}${s.level ? `：${s.level}` : ''}`).join('\n') || '未提供'}

### 教育经历
${(profileData.educationRecords || []).map((e: any) => `
**${e.school}** | ${e.degree || ''}${e.major ? ` · ${e.major}` : ''} | ${e.startDate || ''} - ${e.endDate || '至今'}
${e.description || ''}
`).join('\n') || '未提供'}

### 工作经历
${(profileData.workExperiences || []).map((w: any) => `
**${w.company}** | ${w.title} | ${w.startDate || ''} - ${w.endDate || '至今'}
${w.description || ''}
技术栈：${joinList(w.techStack)}
亮点：${joinList(w.highlights)}
`).join('\n') || '未提供'}

### 项目经历
${(profileData.projectExperiences || []).map((p: any) => `
**${p.name}** | ${p.role || '参与者'} | ${p.startDate || ''} - ${p.endDate || ''}
${p.description || ''}
技术栈：${joinList(p.techStack)}
亮点：${joinList(p.highlights)}
`).join('\n') || '未提供'}

### 证书
${(profileData.certificateRecords || []).map((c: any) => `- ${c.name}${c.issuer ? ` · ${c.issuer}` : ''}${c.date ? ` · ${c.date}` : ''}${c.description ? `：${c.description}` : ''}`).join('\n') || '未提供'}

请生成针对该岗位的定制简历内容。`;
