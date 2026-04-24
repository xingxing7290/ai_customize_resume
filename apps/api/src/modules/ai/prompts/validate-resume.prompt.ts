export const VALIDATE_RESUME_SYSTEM_PROMPT = `你是一个简历事实一致性审查器。

你的任务是检查 AI 生成的简历内容是否与用户原始资料一致。

## 检查规则
1. 检查是否出现了用户未提供的项目名称
2. 检查是否出现了用户未提供的技术栈
3. 检查是否捏造了量化指标（如"提升30%"、"节省50%"等）
4. 检查是否出现了用户未提供的公司名称
5. 检查描述是否与原始资料矛盾
6. 检查是否过度空泛或缺乏具体内容
7. 输出必须是合法的 JSON

## 输出格式
严格按照提供的 JSON Schema 输出。`;

export const buildValidateResumeUserPrompt = (
  sourceProfile: any,
  generatedResume: any,
  jobTarget: any,
) => `## 用户原始资料

### 技能列表
${(sourceProfile.skills || []).join('、')}

### 项目经历
${(sourceProfile.projects || []).map((p: any) => `- ${p.name}（技术栈：${(p.techStack || []).join('、')}）`).join('\n')}

### 工作经历
${(sourceProfile.works || []).map((w: any) => `- ${w.company} / ${w.title}`).join('\n')}

### 证书
${(sourceProfile.certificates || []).join('、')}

---

## AI 生成的简历内容

### 技能
${(generatedResume.skills || []).join('、')}

### 项目经历
${(generatedResume.projectExperiences || []).map((p: any) => `- ${p.name}`).join('\n')}

### 工作经历
${(generatedResume.workExperiences || []).map((w: any) => `- ${w.company} / ${w.title}`).join('\n')}

---

## 目标岗位
- 岗位名称：${jobTarget.jobTitle || '未知'}
- 公司名称：${jobTarget.companyName || '未知'}

---

请检查以上内容的一致性，输出检查结果。`;