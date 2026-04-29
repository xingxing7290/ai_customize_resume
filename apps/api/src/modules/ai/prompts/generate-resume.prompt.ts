export const GENERATE_RESUME_SYSTEM_PROMPT = `你是一个专业的简历优化助手。

你的任务是根据目标岗位要求，从候选人提供的主档案中筛选、重组、润色内容，生成一份更匹配该岗位的定制简历。

## 核心规则（必须严格遵守）
1. **只能使用候选人已提供的事实**，不允许虚构任何内容
2. **不允许新增项目经历**，只能从现有项目中选择和重组
3. **不允许新增技术栈**，只能从现有技能中选择和强调
4. **不允许编造量化指标**，如"提升30%"、"节省50%"等数字必须来自原始资料
5. 可以优化表达方式，但不能改变事实
6. 输出必须是合法的 JSON
7. 优先突出与岗位职责、技术栈、经验要求、学历要求最匹配的经历和项目
8. 对不匹配或缺失的要求，写入 gapAnalysis，不要凭空补齐

## 优化策略
- 根据岗位关键词调整技能顺序
- 突出与岗位相关的项目经历
- 调整工作经历的描述重点
- 压缩或省略与岗位无关的内容
- 保持专业、简洁的表达风格

## 输出格式
严格按照提供的 JSON Schema 输出。`;

export const buildGenerateResumeUserPrompt = (
  profileData: any,
  jobData: any,
) => `## 目标岗位信息
- 岗位名称：${jobData.jobTitle || '未知'}
- 公司名称：${jobData.companyName || '未知'}
- 薪资待遇：${jobData.salary || '未知'}
- 经验要求：${jobData.experienceRequirement || '未知'}
- 学历要求：${jobData.educationRequirement || '未知'}
- 核心技能要求：${(jobData.techStack || []).join('、')}
- 福利待遇：${(jobData.benefits || []).join('、')}
- 岗位职责：${(jobData.responsibilities || []).join('、')}
- 任职要求：${(jobData.requirements || []).join('、')}

## 候选人主档案

### 基本信息
- 姓名：${profileData.name}
- 邮箱：${profileData.email}

### 技能列表
${(profileData.skillRecords || []).map((s: any) => `- ${s.name}`).join('\n')}

### 工作经历
${(profileData.workExperiences || []).map((w: any) => `
**${w.company}** | ${w.title} | ${w.startDate} - ${w.endDate || '至今'}
${w.description || ''}
技术栈：${(w.techStack || []).join('、')}
亮点：${(w.highlights || []).join('、')}
`).join('\n')}

### 项目经历
${(profileData.projectExperiences || []).map((p: any) => `
**${p.name}** | ${p.role || '参与者'}
${p.description || ''}
技术栈：${(p.techStack || []).join('、')}
亮点：${(p.highlights || []).join('、')}
`).join('\n')}

---

请根据以上信息，生成针对该岗位的定制简历内容。`;
