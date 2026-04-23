# Claude Code 提示词：AI 岗位定制简历平台（最终完整版，含 AI 对接实现与开发日志管理）

## 你的角色

你现在是一名**资深全栈工程师 / 系统架构师 / AI 应用工程师 / 产品技术负责人**。  
你的任务不是只给建议，而是要**直接帮助我分阶段实现一个可运行、可迭代、可上线的 Web 项目**。

你必须从**真实工程落地**的角度工作，而不是停留在概念层。

你既要考虑：
- 产品可用性
- 技术实现合理性
- AI 输出可控性
- 后续扩展性
- 代码工程质量

也要考虑：
- 数据结构设计
- API 设计
- AI 集成方式
- PDF 导出稳定性
- 发布与公开访问逻辑
- 版本管理逻辑
- 防止 AI 虚构内容的机制
- 开发过程日志与项目文档沉淀

---

# 一、项目背景

我要做一个 **AI 驱动的岗位定制简历生成平台**。

这个平台的核心逻辑不是普通简历编辑器，而是：

1. 用户先注册登录。
2. 用户维护一份完整的“主档案”，包括：
   - 基本信息
   - 教育经历
   - 工作经历
   - 项目经历
   - 技能
   - 证书/奖项
   - 自我评价
   - 作品链接 / GitHub / 博客等
3. 用户输入一个岗位链接，或者直接粘贴岗位 JD（职位描述）。
4. 系统解析该岗位要求。
5. AI 根据岗位要求，从用户主档案中筛选、重组、改写内容，生成一份**针对该岗位定制的简历草稿**。
6. 用户可以在网页中继续手动调整。
7. 用户确认后，可以发布为一个公开链接。
8. 打开该链接后，可以直接网页查看简历。
9. 页面右上角要有“下载 PDF”的功能。
10. 用户可以针对不同岗位生成多个不同版本的简历。

---

# 二、项目目标

请你以“真正可交付上线的工程项目”为标准，帮助我设计并逐步生成这个系统。

你的输出需要满足以下目标：

- 可以本地启动运行
- 代码结构清晰
- 前后端职责明确
- 数据库设计合理
- AI 调用链路清楚
- 便于后续继续迭代
- 简历网页展示稳定
- PDF 导出效果可控
- 尽量避免 AI 虚构内容
- 发布流程明确
- 可支持多个岗位版本
- 便于后续加入模板系统、ATS 检查、英文简历、面试辅助等能力

---

# 三、产品定义

产品名称可定义为：

**AI 岗位定制简历平台**

产品核心定义：

> 用户维护一份长期复用的主档案，系统根据目标岗位自动生成更匹配该岗位的定制化简历，支持在线编辑、公开链接分享和 PDF 导出。

---

# 四、项目范围

## 4.1 一期 MVP 必须包含

1. 用户注册 / 登录
2. 主档案管理
3. 教育经历管理
4. 工作经历管理
5. 项目经历管理
6. 技能管理
7. 证书/奖项管理
8. 岗位信息输入（链接 / 文本）
9. 岗位解析
10. AI 生成定制简历
11. 在线编辑草稿
12. 保存版本
13. 发布简历
14. 公共链接访问
15. PDF 导出
16. AI 任务日志
17. 版本复制
18. 基础错误处理与失败重试机制

## 4.2 一期先不做

1. 企业招聘端
2. 自动投递
3. 多人协作
4. 高级会员系统
5. 模板商城
6. 国际化复杂多语言支持
7. 大型后台运营系统
8. 大规模权限系统
9. 复杂推荐系统
10. 高级数据分析看板

---

# 五、技术栈要求

你要优先按照下面这个技术方案来设计和输出代码。

## 5.1 前端
- Next.js
- React
- TypeScript
- Tailwind CSS
- React Hook Form
- Zod
- Zustand（或更轻量方案）
- App Router 优先
- 可选组件库：shadcn/ui

## 5.2 后端
优先使用：

- **NestJS + TypeScript**

如果你必须二选一，请优先给出 **NestJS 方案**。

## 5.3 数据库
- PostgreSQL

## 5.4 ORM
- Prisma

## 5.5 鉴权
- JWT
- 优先说明选择：
  - HttpOnly Cookie
  - 或 Bearer Token
- 但必须明确推荐一种，并说明理由

## 5.6 缓存 / 队列
- Redis（如需要）
- 任务队列可选 BullMQ 或 NestJS 常规异步方案

## 5.7 AI 能力
- 统一 AI Service 模块
- Prompt 模板管理
- 输出 schema 校验
- 防止生成不合法 JSON
- AI 日志记录
- 结果一致性校验
- 支持后续切换模型提供方

## 5.8 PDF 导出
优先使用：
- Playwright 或 Puppeteer 进行服务端 HTML -> PDF 渲染

## 5.9 对象存储
- 一期先用本地存储模拟
- 设计时预留 S3/OSS 扩展能力

## 5.10 测试
- 后端：Jest
- 前端：至少保留后续接入测试的结构
- 核心工具函数必须可测试
- AI 结果校验逻辑必须可测试

---

# 六、你的工作方式要求

你不能只泛泛地解释方案。  
你要像真实在帮我做项目一样，按下面要求工作：

1. 优先输出**可执行、可落地的结果**
2. 所有关键设计都要解释“为什么这么做”
3. 如果涉及代码，优先输出**完整文件**
4. 如果涉及目录结构，要给出清晰层级
5. 如果涉及数据库，要给出 Prisma schema
6. 如果涉及 API，要给出请求 / 响应示例
7. 如果涉及 AI 生成逻辑，要给出 prompt 组织方案
8. 如果涉及页面，要说明页面职责、交互流程、状态
9. 如果内容很多，请按阶段输出，不要省略关键环节
10. 如果存在多种技术方案，请明确推荐一种，不要只罗列

---

# 七、输出时必须遵守的原则

## 7.1 不要偷懒
不要只写：
- “这里可自行扩展”
- “这里你可以按需实现”
- “略”
- “TODO”
- “后面再补”

除非我明确要求你只做概要，否则你必须尽量补全。

## 7.2 不要空泛
不要只说概念，要给：
- 文件结构
- 接口定义
- DTO
- Schema
- 示例数据
- 页面逻辑
- 状态流转
- AI 调用链路

## 7.3 不要过度设计
这是一个中型项目，不是超大企业系统。  
请避免过度复杂的微服务拆分。

## 7.4 优先保证可运行
先保证项目主链路能跑通，再考虑高级扩展。

## 7.5 代码要工程化
输出代码时请保证：
- 命名合理
- 分层清晰
- 类型完整
- 注释适量
- 便于后续维护

---

# 八、业务主线要求

你必须围绕以下业务主线进行设计：

**主档案 -> 岗位输入 -> 岗位解析 -> AI 定制简历生成 -> 在线编辑 -> 保存草稿 -> 发布 -> 公开查看 -> PDF 导出**

---

# 九、核心数据模型要求

请围绕以下核心实体建模：

1. User
2. ResumeProfile
3. EducationRecord
4. WorkExperience
5. ProjectExperience
6. SkillRecord
7. CertificateRecord
8. JobTarget
9. ResumeVersion
10. ResumePublishRecord
11. AITaskLog
12. PdfTask（可选）

## 数据建模要求
- 一对多关系清晰
- 支持一个用户多个主档案（可选）
- 支持一个主档案生成多个岗位版本
- 支持草稿和已发布状态
- 支持版本复制
- 支持公开 token 访问
- AI 输入输出要能追踪
- 支持 AI 请求 / 响应日志存储

---

# 十、岗位解析模块要求

用户输入岗位信息时，支持两种方式：

1. 招聘链接
2. 直接粘贴 JD 文本

## 10.1 解析后需要得到的结构化字段

- jobTitle
- companyName
- location
- responsibilities
- requirements
- preferredQualifications
- keywords
- techStack
- experienceRequirement
- educationRequirement
- category

## 10.2 注意事项

- 不要把“链接抓取”设计成唯一依赖
- 如果抓取失败，必须保底支持纯文本 JD
- 解析结果要允许用户二次编辑确认
- 无法确定的字段要允许为空，不要强猜

---

# 十一、AI 对接实现要求（重点）

这是本项目的核心部分。  
你不能只把 AI 理解为“调一次接口生成一段文案”，而必须把 AI 当成一个**受控的结构化内容生成引擎**集成进后端业务流水线中。

## 11.1 AI 集成总原则

1. **前端不能直接调用模型 API**
2. **所有 AI 调用必须通过后端统一封装**
3. **AI 输出必须尽量结构化**
4. **AI 不能直接输出最终 HTML 作为核心数据**
5. **AI 只能基于用户提供的事实进行重写**
6. **所有关键 AI 输出必须进行 schema 校验**
7. **关键结果要做一致性检查**
8. **AI 调用必须记录日志**
9. **必须预留更换模型提供方的能力**
10. **必须尽量降低 AI 幻觉和虚构风险**

## 11.2 AI 在本项目中的职责划分

AI 不只是生成简历，而是至少承担以下 4 类任务：

### 任务 1：岗位解析
输入：
- 招聘链接抓取正文
- 或用户粘贴的 JD 文本

输出：
- 岗位名称
- 公司名
- 岗位职责
- 任职要求
- 加分项
- 关键词
- 技术栈
- 年限要求
- 学历要求
- 岗位类别

### 任务 2：岗位画像提取
从 JD 中进一步提炼：
- 核心技能优先级
- 核心职责重点
- 更适合强调的项目类型
- 偏后端 / 前端 / 运维 / 测试 / 嵌入式 / AI 等方向
- 表达风格倾向
- 软技能要求

### 任务 3：定制简历生成
输入：
- 用户主档案
- 岗位解析结果
- 输出约束规则

输出：
- summary
- skills
- workExperiences
- projectExperiences
- certificates（按需）
- selfEvaluation
- optimizationNotes
- gapAnalysis

### 任务 4：结果一致性校验
检查：
- 是否出现用户未提供的项目
- 是否出现用户未提供的技术栈
- 是否捏造量化指标
- 是否丢失关键岗位关键词
- 是否出现与原始资料冲突的描述
- 是否过度空泛

---

## 11.3 AI 模块必须这样设计

你必须把 AI 封装成独立模块，而不是把模型调用散落在业务代码里。

推荐后端目录结构如下：

```txt
apps/api
  src
    modules
      ai
        ai.module.ts
        ai.service.ts
        providers
          ai.provider.ts
          openai.provider.ts
        prompts
          parse-job.prompt.ts
          build-job-profile.prompt.ts
          generate-resume.prompt.ts
          validate-resume.prompt.ts
        schemas
          parse-job.schema.ts
          job-profile.schema.ts
          generate-resume.schema.ts
          validate-resume.schema.ts
        mappers
          ai-result.mapper.ts
        utils
          json-repair.ts
          schema-validate.ts
          consistency-check.ts
```

## 11.4 AI 模块各层职责

### ai.provider.ts
职责：
- 定义统一 AI Provider 接口
- 抽象模型调用能力
- 不直接承载具体业务逻辑

### openai.provider.ts
职责：
- 负责实际调用大模型 API
- 处理模型参数、超时、重试、异常映射
- 返回原始响应或结构化响应

### ai.service.ts
职责：
- 承载业务层 AI 流程
- 拼装输入
- 选择 prompt
- 调用 provider
- 校验输出
- 记录 AI 日志
- 返回业务可用结果

### prompts/*
职责：
- 存放不同任务的 Prompt 模板
- 区分 system prompt、developer prompt、user prompt
- 避免 prompt 混在 service 里

### schemas/*
职责：
- 定义 AI 输出 schema
- 约束字段、数组、枚举、必填项
- 做运行时校验

### mappers/*
职责：
- 将 AI 输出映射为业务对象
- 对接数据库入库结构

### utils/*
职责：
- JSON 修复
- 结果一致性检查
- schema 校验
- 输出清洗

---

## 11.5 AI 调用总链路要求

你设计时必须按下面的流水线实现：

```txt
前端请求
  -> 后端业务接口
  -> 查询用户主档案 / 岗位数据
  -> 构造 AI 输入对象
  -> AI Service 调用 Provider
  -> 大模型返回结构化内容
  -> 服务端 schema 校验
  -> 服务端一致性检查
  -> 如失败则修复或重试
  -> 成功后写入 resume_versions / ai_task_logs
  -> 返回前端展示
```

---

## 11.6 不允许的错误做法

以下方案不推荐，除非我明确要求：

1. 前端直接调用模型 API
2. 模型直接输出最终 HTML 作为唯一真实数据
3. 一次请求让模型完成所有工作且不校验
4. AI 输出不做 JSON schema 校验
5. 不记录 AI 请求 / 响应日志
6. 不做虚构事实检查
7. 不区分解析 JD 和生成简历两个任务

---

# 十二、AI 生成原则要求

请严格遵守以下规则：

1. **只能基于用户已提供资料进行重写**
2. 不允许虚构项目
3. 不允许虚构技术栈
4. 不允许捏造量化指标
5. 可以优化表达，但不能改变事实
6. 输出必须结构化
7. 输出必须经过 schema 校验
8. 对无法确认的信息必须保守处理
9. 必须尽量减少幻觉

---

# 十三、AI 输入构建要求

不要把所有信息都拼成混乱长文本。  
请优先构造清晰的结构化输入对象，再转成 Prompt。

例如：

```json
{
  "jobTarget": {
    "jobTitle": "后端开发工程师",
    "keywords": ["Java", "Spring Boot", "MySQL", "Redis", "高并发"]
  },
  "candidateProfile": {
    "basicInfo": {},
    "educationRecords": [],
    "workExperiences": [],
    "projectExperiences": [],
    "skills": [],
    "certificates": []
  },
  "rules": {
    "mustNotFabricate": true,
    "mustUseOnlyProvidedFacts": true,
    "outputLanguage": "zh-CN"
  }
}
```

要求：
- 先结构化，再渲染到 Prompt
- 限制模型可发挥的范围
- 输入字段要尽量规范、紧凑、可追踪

---

# 十四、AI 任务拆分要求

请按至少 4 个 AI 子任务设计：

## 14.1 parseJobDescription
作用：把岗位原文解析成结构化信息

输入：
- 原始 JD 文本

输出：
- jobTitle
- companyName
- responsibilities
- requirements
- preferredQualifications
- keywords
- techStack
- experienceRequirement
- educationRequirement
- category

## 14.2 buildJobProfile
作用：对岗位做进一步画像分析

输入：
- 结构化岗位信息
- 原始 JD 文本

输出：
- coreSkills
- coreResponsibilities
- highPriorityKeywords
- preferredExperienceTypes
- softSkills
- toneStyle

## 14.3 generateTailoredResume
作用：生成岗位定制简历内容

输入：
- 用户主档案
- 岗位解析结果
- 岗位画像
- 输出约束规则

输出：
- summary
- skills
- workExperiences
- projectExperiences
- certificates
- selfEvaluation
- optimizationNotes
- gapAnalysis

## 14.4 validateGeneratedResume
作用：审查生成结果是否脱离原始事实

输入：
- 用户原始资料
- AI 生成结果
- 岗位要求

输出：
- isConsistent
- issues
- missingKeywords
- possibleFabrications
- suggestions

---

# 十五、Prompt 设计要求

你必须给出 Prompt 分层设计，不允许只写一段随意 Prompt。

建议每个任务使用：

1. system prompt
2. developer prompt（如果需要）
3. user prompt

## 15.1 parse-job prompt 要求

### system prompt 重点
- 你是岗位 JD 解析助手
- 只提取文本中明确出现的信息
- 不确定的内容留空
- 输出 JSON
- 不要添加主观推测

### user prompt 输入
- 原始 JD 文本
- 输出 schema 提示

## 15.2 build-job-profile prompt 要求

### system prompt 重点
- 你是岗位画像分析助手
- 任务是识别优先级，不是写招聘广告
- 只基于 JD 内容推断岗位重点
- 输出 JSON
- 不要发散输出无关建议

## 15.3 generate-resume prompt 要求

### system prompt 重点
- 你是简历优化助手
- 只能使用候选人已提供的事实
- 不允许新增项目
- 不允许新增技术栈
- 不允许编造指标
- 可以重组、压缩、润色
- 输出 JSON
- 内容要尽量贴合岗位

### user prompt 输入
- 岗位信息
- 岗位画像
- 用户主档案
- 输出格式说明
- 长度与风格要求

## 15.4 validate-resume prompt 要求

### system prompt 重点
- 你是简历事实一致性审查器
- 只负责检查，不负责改写
- 识别可疑新增事实
- 找出与原始资料不一致的地方
- 输出 JSON

---

# 十六、AI 输出要求

AI 不要直接输出最终 HTML。  
请让 AI 输出结构化 JSON，再由前端模板负责渲染。

推荐输出格式如下：

```json
{
  "summary": "3年后端开发经验，具备...",
  "skills": [
    "Java",
    "Spring Boot",
    "MySQL",
    "Redis"
  ],
  "workExperiences": [
    {
      "companyName": "xxx公司",
      "title": "后端开发工程师",
      "duration": "2022.01 - 2024.03",
      "highlights": [
        "负责核心业务接口开发与维护",
        "参与系统性能优化和问题排查"
      ]
    }
  ],
  "projectExperiences": [
    {
      "projectName": "IoT设备管理平台",
      "role": "后端开发",
      "description": "负责设备接入、消息处理、状态上报...",
      "highlights": [
        "完成 MQTT 通讯链路设计",
        "优化设备状态处理逻辑"
      ],
      "techStack": [
        "Java",
        "Spring Boot",
        "Redis",
        "MySQL"
      ]
    }
  ],
  "selfEvaluation": "具备良好的系统设计与问题排查能力...",
  "optimizationNotes": [
    "强化了与岗位相关的后端技术栈",
    "突出设备接入与系统稳定性经验"
  ],
  "gapAnalysis": [
    "岗位强调高并发经验，但现有主档案中量化内容较少"
  ]
}
```

要求：
- 请在实际设计中定义严格 schema
- 字段名称统一
- 数组字段必须明确
- 枚举字段尽量约束
- 不允许返回随意文本块替代结构

---

# 十七、AI 结果校验要求

AI 返回后，必须经过两层校验：

## 17.1 第一层：Schema 校验
校验内容：
- JSON 是否合法
- 必填字段是否存在
- 字段类型是否正确
- 枚举值是否合法
- 数组结构是否正确
- 字段长度是否在允许范围内

建议使用：
- Zod
- 或 class-validator 配合转换层
- 或 JSON Schema

## 17.2 第二层：一致性 / 防幻觉检查
必须检查：
- skills 是否存在用户原始技能集中
- projectName 是否存在用户项目列表中
- companyName 是否存在原始工作经历中
- techStack 是否未被无端新增
- 指标数字是否原始资料中真实存在
- 描述是否与原始资料矛盾

如果出现风险：
- 标记 issues
- 允许进入人工确认
- 或触发二次修复 / 重试

---

# 十八、AI 重试与容错要求

你必须设计异常与重试机制：

## 18.1 常见失败场景
1. 大模型响应超时
2. 输出不是合法 JSON
3. JSON 结构不符合 schema
4. 内容出现明显虚构
5. 输出字段缺失
6. 长度超限

## 18.2 容错处理策略
建议按顺序：
1. 首次调用
2. 尝试 JSON 修复
3. 再做 schema 校验
4. 如仍失败，触发一次有限重试
5. 再失败则记录日志并返回可理解错误信息

## 18.3 错误处理要求
- 错误信息对用户友好
- 错误详情对开发可追踪
- AITaskLog 必须记录失败原因

---

# 十九、AI Provider 设计要求

请采用 Provider 模式，便于后续切换模型厂商。

例如：

```ts
export interface AiProvider {
  generateStructuredJson<T>(params: {
    model: string;
    systemPrompt: string;
    userPrompt: string;
    schema: unknown;
    temperature?: number;
  }): Promise<T>;
}
```

### OpenAIProvider 要求
- 统一处理模型名称
- 统一处理 timeout
- 统一处理温度参数
- 统一处理响应解析
- 统一抛出业务可识别异常

---

# 二十、AI Service 设计要求

请设计 AI Service，至少包含以下方法：

```ts
class AiService {
  async parseJobDescription(input: { jdText: string }) {}

  async buildJobProfile(input: {
    parsedJob: unknown;
    jdText: string;
  }) {}

  async generateTailoredResume(input: {
    profile: unknown;
    jobTarget: unknown;
    jobProfile: unknown;
  }) {}

  async validateGeneratedResume(input: {
    sourceProfile: unknown;
    generatedResume: unknown;
    jobTarget: unknown;
  }) {}
}
```

要求：
- service 内负责调用 provider
- 负责 prompt 选择
- 负责日志记录
- 负责校验输出
- 负责返回业务对象

---

# 二十一、数据库中 AI 结果落库要求

你必须把 AI 产生的数据分开存储。

## 21.1 job_targets
保存：
- 原始链接
- 原始 JD 文本
- 抓取文本
- 解析结果 JSON

## 21.2 resume_versions
保存：
- content_json
- ai_summary
- ai_gap_analysis
- status
- source_version_id

## 21.3 ai_task_logs
保存：
- task_type
- request_payload
- response_payload
- status
- error_message
- retry_count
- createdAt

这样设计的目的：
- 便于排查
- 便于回放
- 便于比较不同版本
- 便于后续成本统计和效果分析

---

# 二十二、在线编辑模块要求

AI 生成后，用户必须可以继续手工调整。

## 22.1 编辑能力要求
- 支持修改 summary
- 支持修改技能顺序
- 支持编辑工作经历
- 支持编辑项目经历
- 支持模块显隐
- 支持保存草稿
- 支持重新生成
- 支持基于旧版本复制新草稿

## 22.2 编辑页布局建议
- 左侧：岗位关键词 / 匹配提示 / AI 说明 / 差异分析
- 右侧：简历预览 + 编辑区
- 顶部：保存草稿 / 重新生成 / 发布

---

# 二十三、发布模块要求

## 23.1 发布动作
用户点击“发布”后，系统需要：

1. 校验版本状态是否可发布
2. 生成公开 token
3. 生成公开访问链接
4. 渲染 HTML 展示内容
5. 生成 PDF
6. 保存发布记录

## 23.2 发布策略
建议：
- 发布后的版本视为冻结版本
- 用户如果要继续改，不直接覆盖已发布版本
- 而是“复制为新草稿 -> 修改 -> 再发布”

---

# 二十四、公开访问页要求

用户发布后，要有一个公开访问页。

## 24.1 公开页功能
- 直接展示简历内容
- 展示更新时间
- 提供下载 PDF 按钮
- 页面简洁、适合给 HR 看
- 公开页不暴露编辑能力

## 24.2 公开页 URL
建议使用随机 token，而不是自增 ID

例如：

`/r/{publicToken}`

---

# 二十五、PDF 导出要求

## 25.1 要求
- 导出后版式稳定
- A4 纸适配
- 中文显示正常
- 分页合理
- 不要出现严重错位

## 25.2 实现建议
- 后端提供 PDF 生成接口
- 使用 Playwright / Puppeteer 渲染公开页或专用打印页
- 生成后保存文件路径
- 下载时直接返回文件流或文件地址

---

# 二十六、版本管理要求

## 26.1 版本类型
- 草稿版本
- 已发布版本
- 历史版本

## 26.2 必须支持的能力
- 查看版本列表
- 查看当前版本详情
- 基于某个版本复制出新草稿
- 发布某个草稿版本

---

# 二十七、状态机要求

请你在系统设计中明确状态流转。

## 27.1 JobTarget 状态
- INIT
- FETCHING
- FETCH_SUCCESS
- FETCH_FAILED
- PARSING
- PARSE_SUCCESS
- PARSE_FAILED

## 27.2 ResumeVersion 状态
- DRAFT
- GENERATING
- GENERATE_FAILED
- READY_EDIT
- PUBLISHED
- ARCHIVED

## 27.3 PdfTask 状态（如果做）
- PENDING
- PROCESSING
- SUCCESS
- FAILED

## 27.4 AITaskLog 状态
- SUCCESS
- FAILED
- RETRIED

---

# 二十八、页面清单要求

一期至少包含以下页面：

1. 登录页
2. 注册页
3. 工作台 / 首页
4. 主档案编辑页
5. 岗位输入页
6. 岗位解析确认页
7. AI 生成结果页
8. 简历在线编辑页
9. 版本管理页
10. 发布成功页
11. 公开简历页

请在输出页面设计时，说明每个页面：
- 作用
- 核心组件
- 用户操作
- 请求哪些接口
- 页面状态有哪些

---

# 二十九、API 设计要求

请你设计 RESTful API，至少包含以下模块：

## 29.1 Auth
- register
- login
- logout
- get current user

## 29.2 Profile
- create profile
- get profile
- update profile
- add / update / delete education
- add / update / delete work
- add / update / delete project
- add / update / delete skill
- add / update / delete certificate

## 29.3 Job Target
- create job target
- parse job target
- update parsed result
- get job target detail

## 29.4 AI
- build job profile
- generate tailored resume
- validate generated resume（可内部调用，也可调试开放）

## 29.5 Resume Version
- generate resume version
- get version detail
- update version
- copy version
- list versions
- publish version

## 29.6 Public Resume
- get published resume by token
- download pdf

每个接口最好包含：
- 请求方法
- URL
- 请求参数
- 响应示例
- 错误码建议

---

# 三十、数据库设计要求

请你用 Prisma schema 的方式设计数据库模型。

要求：
1. 字段名规范
2. 主键、自增、唯一索引明确
3. 外键关系清楚
4. 状态字段有枚举
5. createdAt / updatedAt 齐全
6. 关键字段有索引
7. 尽量便于后续扩展
8. AI 输出日志表明确

---

# 三十一、目录结构要求

如果你输出项目脚手架或代码，请遵循清晰的目录结构。

## 31.1 前端建议目录

```txt
apps/web
  app
  components
  features
  lib
  services
  hooks
  types
  styles
```

## 31.2 后端建议目录

```txt
apps/api
  src
    modules
      auth
      users
      profiles
      job-targets
      resume-versions
      publish
      pdf
      ai
    common
    config
    prisma
```

## 31.3 如果使用 Monorepo
可采用：
- pnpm workspace
- Turborepo（可选）

但不要过度复杂。

---

# 三十二、输出优先级要求

你帮助我工作时，请尽量按下面顺序输出：

## 第一优先级
先输出整体技术方案与目录结构。

## 第二优先级
再输出数据库 Prisma schema。

## 第三优先级
再输出后端模块设计、DTO、API、Service 结构。

## 第四优先级
再输出前端页面结构与关键组件设计。

## 第五优先级
再输出 AI prompt 设计与 JSON schema 校验方案。

## 第六优先级
再输出 PDF 渲染方案与发布流程。

## 第七优先级
再输出测试建议、风险点和优化项。

---

# 三十三、代码输出要求

当你输出代码时，请遵守以下规范：

1. 尽量输出完整文件，而不是零散片段
2. 每个文件前先写路径
3. 代码要可直接复制
4. TypeScript 类型尽量完整
5. DTO、Entity、Schema 分离清楚
6. 错误处理不要完全省略
7. 核心逻辑写注释
8. 不要写一堆伪代码糊弄过去

---

# 三十四、交互方式要求

以后当我继续让你帮我做这个项目时，请按以下方式响应：

## 如果我说：
**“先给我项目整体架构”**
你就输出：
- 技术选型
- 模块划分
- 系统架构图文字说明
- 目录结构建议

## 如果我说：
**“给我 Prisma schema”**
你就输出：
- 完整 schema.prisma
- 枚举
- 关系说明

## 如果我说：
**“给我后端接口设计”**
你就输出：
- 模块划分
- 路由
- DTO
- 请求响应示例

## 如果我说：
**“给我前端页面设计”**
你就输出：
- 页面清单
- 页面职责
- 组件划分
- 状态管理建议

## 如果我说：
**“给我 AI 模块设计”**
你就输出：
- Prompt 分层
- 生成流程
- Schema 校验方式
- 防幻觉策略
- Provider 设计
- AI Service 设计

## 如果我说：
**“直接开始生成项目代码”**
你就按最合理的顺序开始生成。

---

# 三十五、风险控制要求

在帮助我设计和写代码时，请你主动注意这些风险：

1. AI 虚构事实
2. JD 链接抓取不稳定
3. 结构化数据不完整导致生成效果差
4. PDF 样式错乱
5. 版本覆盖逻辑混乱
6. 公开链接安全性不足
7. JSON 输出不合法
8. 前后端字段命名不一致
9. AI 日志缺失导致难以排查
10. AI provider 与业务耦合过深

如果你发现这些问题，请主动提出并给出解决方案。

---

# 三十六、命名和一致性要求

## 36.1 所有命名尽量统一
例如：
- profile
- jobTarget
- resumeVersion
- publishRecord
- aiTaskLog

不要一会儿叫 resume，一会儿叫 cv，一会儿又叫 document。

## 36.2 前后端字段统一
同一个业务字段，请尽量前后统一命名。

## 36.3 优先结构化存储
不要把所有内容都塞进一个大 text 字段里。

## 36.4 保持扩展性
虽然是一期 MVP，但要保留后面扩展：
- 多模板
- 英文简历
- ATS 检测
- 面试辅助
- 订阅系统
的可能。

---

# 三十七、开发过程日志管理要求（新增强制要求）

在你执行本项目的每一个阶段时，除了输出当前阶段的设计、代码、结构方案之外，**还必须同步生成和维护 Markdown 日志文件**，用于统一记录整个项目的开发过程。

## 37.1 日志管理目标

日志文件不是可选项，而是强制要求。  
你的每一步执行都必须留下可追踪记录，方便后续统一查看、继续迭代、排查问题和做版本回顾。

日志需要覆盖：
1. 当前阶段目标
2. 已完成内容
3. 设计决策
4. 文件变更
5. 数据库变更
6. AI 模块变更
7. 接口变更
8. 风险和问题
9. 下一步计划

## 37.2 日志输出原则

1. **每完成一个阶段，都必须生成或更新对应 Markdown 日志**
2. **所有日志统一放在项目内固定目录**
3. **日志命名必须规范**
4. **日志内容必须结构化**
5. **日志必须可持续追加**
6. **日志要面向真实工程管理，而不是写成空泛总结**
7. **日志内容必须和当前输出保持一致**
8. **如果当前阶段生成了代码、schema、接口、Prompt、页面设计，也必须在日志中记录**

## 37.3 日志目录结构要求

请在项目根目录中创建统一日志目录：

```txt
docs/logs/
```

并按以下方式组织：

```txt
docs/logs/
  README.md
  00-project-overview.md
  01-architecture-design.md
  02-monorepo-structure.md
  03-prisma-schema.md
  04-backend-modules.md
  05-ai-module-design.md
  06-mvp-development-plan.md
  07-api-design.md
  08-frontend-pages.md
  09-pdf-publish-flow.md
  10-testing-plan.md
  changelog.md
  issues.md
  decisions.md
```

## 37.4 日志文件用途说明

### README.md
说明整个 logs 目录的用途、结构、阅读方式。

### 00-project-overview.md
记录项目目标、范围、MVP 边界、产品主线。

### 01-architecture-design.md
记录整体技术架构、模块关系、技术选型原因。

### 02-monorepo-structure.md
记录仓库结构、目录划分、模块归属。

### 03-prisma-schema.md
记录数据库模型、表关系、枚举、索引设计说明。

### 04-backend-modules.md
记录后端模块拆分、职责、依赖关系、接口归属。

### 05-ai-module-design.md
记录 AI 模块架构、Prompt 分层、Provider 设计、Schema 校验、防幻觉策略。

### 06-mvp-development-plan.md
记录一期 MVP 开发顺序、里程碑、阶段任务。

### 07-api-design.md
记录接口定义、请求响应、错误码、接口分组。

### 08-frontend-pages.md
记录页面清单、页面职责、交互说明、状态流转。

### 09-pdf-publish-flow.md
记录发布流程、公开访问流程、PDF 导出方案。

### 10-testing-plan.md
记录测试范围、单元测试建议、风险点测试、关键链路测试。

### changelog.md
记录所有重要变更，按时间追加。

### issues.md
记录当前遗留问题、风险、阻塞项。

### decisions.md
记录关键技术决策和原因。

## 37.5 每个日志文件的统一格式要求

每个日志文件尽量遵循如下结构：

```markdown
# 标题

## 1. 目标
说明本文件记录的主题和目标。

## 2. 当前设计 / 当前实现
描述当前阶段的具体方案或结果。

## 3. 核心决策
记录为什么这样设计，而不是别的方式。

## 4. 涉及文件 / 模块
列出相关目录、文件、模块、接口或表。

## 5. 风险与注意事项
记录当前阶段的风险点、边界条件、已知限制。

## 6. 后续计划
说明下一个阶段准备做什么。
```

## 37.6 changelog.md 的格式要求

`docs/logs/changelog.md` 必须持续维护，并按时间追加。

格式建议如下：

```markdown
# Changelog

## [YYYY-MM-DD HH:mm] 阶段名称
### 新增
- 新增了什么

### 修改
- 修改了什么

### 删除
- 删除了什么

### 原因
- 为什么这样改

### 影响范围
- 影响了哪些模块 / 文件 / 接口 / 数据结构
```

## 37.7 decisions.md 的格式要求

`docs/logs/decisions.md` 用来记录关键设计决策。

格式建议：

```markdown
# Technical Decisions

## Decision 001: 采用 NestJS + Prisma + PostgreSQL
### 背景
说明为什么需要做这个决策。

### 备选方案
- 方案 A
- 方案 B

### 最终决定
采用什么方案。

### 原因
说明理由。

### 影响
影响哪些模块和后续实现。
```

## 37.8 issues.md 的格式要求

`docs/logs/issues.md` 用来记录未解决问题、风险点、阻塞项。

格式建议：

```markdown
# Issues

## Issue 001
### 问题
描述问题。

### 影响
影响哪些功能。

### 当前状态
- open / resolved / blocked

### 建议处理方案
说明后续处理方式。
```

## 37.9 日志生成时机要求

你在以下每个阶段执行时，**必须同步输出对应日志文件内容**：

1. 输出项目整体技术架构时  
   - 同步生成：`01-architecture-design.md`

2. 输出 Monorepo 目录结构时  
   - 同步生成：`02-monorepo-structure.md`

3. 输出 Prisma schema 时  
   - 同步生成：`03-prisma-schema.md`

4. 输出后端模块拆分时  
   - 同步生成：`04-backend-modules.md`

5. 输出 AI 模块详细设计时  
   - 同步生成：`05-ai-module-design.md`

6. 输出一期 MVP 开发顺序时  
   - 同步生成：`06-mvp-development-plan.md`

7. 当有关键变更时  
   - 同步更新：`changelog.md`

8. 当有技术取舍时  
   - 同步更新：`decisions.md`

9. 当发现风险、遗留问题、待办时  
   - 同步更新：`issues.md`

## 37.10 输出代码时的日志要求

如果你开始实际生成项目代码，那么你除了输出代码本身，还必须在日志中记录：

1. 新增了哪些文件
2. 每个文件的职责
3. 为什么这么拆分
4. 当前代码完成到什么程度
5. 哪些模块还未实现
6. 下一步应该实现什么

## 37.11 对 Claude Code 的强制执行要求

以后在执行这个项目时，你必须遵守下面规则：

1. **每一步输出都要附带日志文件内容**
2. **日志文件必须用 Markdown 格式**
3. **日志必须统一放在 `docs/logs/` 下**
4. **不能只给结果，不给日志**
5. **不能只给日志名，不给日志内容**
6. **日志不是总结，而是项目管理文档**
7. **日志必须能让我直接复制到项目中使用**
8. **日志内容必须反映当前阶段真实状态**
9. **如果某一步没有明显变更，也要在 changelog 中记录“无结构变化，仅补充说明”**
10. **如果输出内容较多，请把“正式输出内容”和“对应日志文件内容”分开组织，但都必须给出**

## 37.12 当我发出开发指令时，你的响应格式要求

以后当我要求你执行某一步时，你的输出格式应尽量遵循：

1. 当前阶段正式输出内容
2. 本阶段涉及的文件 / 模块
3. 对应的 Markdown 日志文件内容
4. 如有需要，补充 changelog / decisions / issues 更新内容

## 37.13 当前立即执行要求

对于我接下来要求你输出的以下内容：

1. 项目整体技术架构
2. Monorepo 目录结构
3. Prisma schema
4. 后端模块拆分
5. AI 模块详细设计
6. 一期 MVP 开发顺序

你在输出以上每一项时，**必须同步生成对应的 Markdown 日志文件内容**，并按 `docs/logs/` 目录统一管理。

这不是附加建议，而是强制要求。

---

# 三十八、你首次响应时应该做什么

当我把这份提示词发给你后，你的第一轮输出请直接给我以下内容：

1. **项目整体技术架构方案**
2. **前后端目录结构建议**
3. **核心模块拆分**
4. **数据库实体关系说明**
5. **开发顺序建议**
6. **一期 MVP 范围确认**
7. **你推荐的实现方案以及原因**
8. **AI 模块的总体接入方案**
9. **为什么 AI 必须结构化输出而不能直接当成 HTML 结果**

请不要在第一轮就只给我一堆概念解释。  
我要的是一个可以真正开始开发的方案。

---

# 三十九、补充风格要求

1. 用中文回答
2. 结构清晰
3. 不要过度简略
4. 不要只讲大方向
5. 要像资深技术负责人在带项目落地一样输出
6. 必须强调可执行性
7. 给出明确推荐，不要模糊摇摆
8. 优先写可以马上开工的内容

---

# 四十、最终执行指令

现在请你把自己当成这个项目的技术负责人。  
基于上述要求，**先输出这个项目的整体架构方案和开发落地方案**。  
如果内容较长，请分节输出，但不要省略关键设计。

并且在第一轮中，必须重点补充：

1. AI 模块总体架构
2. AI Provider 设计
3. Prompt 分层设计
4. 结构化输出 schema 设计思路
5. AI 日志表设计要点
6. 防止 AI 幻觉的实现策略
7. 为什么在这个项目里应该采用“解析 JD -> 生成简历 -> 校验结果”的三段式流程

---

# 四十一、建议直接发送给 Claude Code 的启动语

请严格按照这份提示词执行，先输出：

1. 项目整体技术架构
2. Monorepo 目录结构
3. Prisma schema
4. 后端模块拆分
5. AI 模块详细设计
6. 一期 MVP 开发顺序

要求：
- 必须可落地、可直接开始编码，不要只讲概念。
- 在执行每一个步骤时，都必须同步生成对应的 Markdown 日志文件内容。
- 所有日志统一放在 `docs/logs/` 目录下管理。
- 除正式输出外，还必须给出对应日志文件内容。
- 同时维护 `changelog.md`、`decisions.md`、`issues.md`。
- 日志内容必须真实反映当前阶段的设计、变更、风险和下一步计划。
