# AI 模块详细设计

## 1. 目标

设计一个可控、可扩展、可追踪的 AI 集成模块，支撑岗位解析、简历生成等核心业务。

## 2. AI 模块架构

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           AI Service Layer                               │
│  parseJobDescription | buildJobProfile | generateResume | validateResume │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           Provider Layer                                 │
│  AI Provider Interface → OpenAI Provider | Claude Provider | ...        │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           Support Layer                                  │
│  Prompts | Schemas (Zod) | Mappers | Utils (JSON修复/一致性检查)         │
└─────────────────────────────────────────────────────────────────────────┘
```

## 3. 核心设计原则

### 3.1 为什么 AI 必须结构化输出

| 问题 | 解决方案 |
|------|----------|
| HTML 难以编辑 | JSON 可直接编辑 |
| HTML 难以校验 | JSON 可做 Schema 校验 |
| HTML 难以版本管理 | JSON 易于 diff |
| HTML 难以多模板适配 | JSON 可渲染为任意模板 |
| HTML 难以做一致性检查 | JSON 可做字段级检查 |

### 3.2 三段式流程设计

```
JD 解析 → 简历生成 → 结果校验
```

| 阶段 | 输入 | 输出 | 目的 |
|------|------|------|------|
| JD 解析 | JD 文本 | 结构化岗位信息 | 提取关键要求 |
| 简历生成 | 主档案 + 岗位信息 | 定制简历 JSON | 匹配岗位要求 |
| 结果校验 | 原始档案 + 生成结果 | 校验报告 | 防止虚构 |

## 4. Provider 设计

### 4.1 接口定义

```typescript
interface AiProvider {
  generateStructuredJson<T>(params: {
    systemPrompt: string;
    userPrompt: string;
    schema: ZodSchema<T>;
    temperature?: number;
  }): Promise<{ data: T; tokenUsed: number; durationMs: number }>;
}
```

### 4.2 OpenAI Provider

- 使用 `gpt-4o` 模型
- 支持 Structured Output (JSON Mode)
- 统一错误处理和重试

## 5. Prompt 设计

### 5.1 岗位解析 Prompt

**System Prompt 要点：**
- 只提取明确出现的信息
- 不确定的字段留空
- 输出合法 JSON
- 不添加主观推测

**User Prompt 输入：**
- 原始 JD 文本
- 输出字段说明

### 5.2 简历生成 Prompt

**System Prompt 核心规则：**
1. 只能使用候选人已提供的事实
2. 不允许新增项目经历
3. 不允许新增技术栈
4. 不允许编造量化指标
5. 可以优化表达，但不能改变事实

**User Prompt 输入：**
- 目标岗位信息
- 候选人主档案
- 优化策略说明

### 5.3 结果校验 Prompt

**System Prompt 要点：**
- 只负责检查，不负责改写
- 识别可疑新增事实
- 找出不一致的地方
- 输出校验报告 JSON

## 6. Schema 定义

### 6.1 岗位解析输出

```typescript
ParseJobSchema = {
  jobTitle: string?
  companyName: string?
  location: string?
  responsibilities: string[]
  requirements: string[]
  preferredQualifications: string[]
  keywords: string[]
  techStack: string[]
  experienceRequirement: string?
  educationRequirement: string?
  category: string?
}
```

### 6.2 简历生成输出

```typescript
GenerateResumeSchema = {
  summary: string?
  skills: string[]
  workExperiences: { companyName, title, duration, highlights[] }[]
  projectExperiences: { projectName, role, description, highlights[], techStack[] }[]
  certificates: string[]
  selfEvaluation: string?
  optimizationNotes: string[]
  gapAnalysis: string[]
}
```

### 6.3 校验结果输出

```typescript
ValidateResumeSchema = {
  isConsistent: boolean
  issues: { type, field, description, severity }[]
  missingKeywords: string[]
  possibleFabrications: string[]
  suggestions: string[]
}
```

## 7. 防幻觉策略

### 7.1 输入约束

- 结构化输入对象
- 明确的字段来源
- 限制模型发挥范围

### 7.2 输出校验

- Schema 校验 (Zod)
- 一致性检查
  - 技能是否在原始列表中
  - 公司名是否匹配
  - 项目名是否匹配
  - 量化指标是否来自原始资料

### 7.3 人工确认

- 解析结果允许用户修正
- 生成结果标记可疑内容
- 高风险问题提示用户确认

## 8. 错误处理

### 8.1 常见失败场景

| 场景 | 处理方式 |
|------|----------|
| 响应超时 | 设置 30s 超时，异步处理 |
| JSON 不合法 | 尝试 JSON 修复 |
| Schema 不匹配 | 返回错误，记录日志 |
| 内容虚构 | 标记问题，提示用户 |

### 8.2 重试策略

1. 首次调用
2. 失败后尝试 JSON 修复
3. 修复失败则重试一次
4. 仍失败则记录日志，返回错误

## 9. 日志记录

### 9.1 记录内容

- taskType: 任务类型
- requestPayload: 请求内容
- responsePayload: 响应内容
- status: 状态
- errorMessage: 错误信息
- retryCount: 重试次数
- durationMs: 耗时
- tokenUsed: Token 消耗

### 9.2 用途

- 问题排查
- 效果分析
- 成本统计
- 结果回放

## 10. 涉及文件

| 文件 | 职责 |
|------|------|
| ai.module.ts | 模块定义 |
| ai.service.ts | 流程编排 |
| providers/ai.provider.interface.ts | 接口定义 |
| providers/openai.provider.ts | OpenAI 实现 |
| prompts/*.ts | Prompt 模板 |
| schemas/*.ts | Zod Schema |
| utils/consistency-check.ts | 一致性检查 |
| utils/json-repair.ts | JSON 修复 |

## 11. 风险与注意事项

### 11.1 模型限制

- Token 限制：注意输入长度
- 输出限制：分批处理大量内容
- 费用控制：监控 Token 消耗

### 11.2 质量控制

- Prompt 需要持续优化
- 定期检查生成质量
- 收集用户反馈

### 11.3 扩展性

- Provider 接口支持切换模型
- Schema 可独立演进
- Prompt 可配置化管理

## 12. 后续计划

1. 实现基础 Provider 接口
2. 实现岗位解析功能
3. 实现简历生成功能
4. 实现一致性检查
5. 完善错误处理和重试
