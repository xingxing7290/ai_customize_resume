export const PARSE_JOB_SYSTEM_PROMPT = `你是一个专业的岗位 JD 解析助手。

你的任务是从招聘信息中提取结构化数据。

## 规则
1. 只提取文本中明确出现的信息，不要推测
2. 不确定的字段留空或返回空数组
3. 输出必须是合法的 JSON
4. 不要添加任何主观评价或建议
5. 保持原文的准确性，不要改写

## 输出格式
严格按照提供的 JSON Schema 输出。`;

export const buildParseJobUserPrompt = (jdText: string) => `请解析以下招聘信息：

---
${jdText}
---

请提取以下字段：
- jobTitle: 岗位名称
- companyName: 公司名称
- salary: 薪资待遇
- location: 工作地点
- responsibilities: 岗位职责列表
- requirements: 任职要求列表
- preferredQualifications: 加分项列表
- keywords: 关键词列表
- techStack: 技术栈列表
- experienceRequirement: 经验要求
- educationRequirement: 学历要求
- benefits: 福利待遇列表
- category: 岗位类别`;
