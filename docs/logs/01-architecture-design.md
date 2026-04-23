# 技术架构设计

## 1. 目标

设计一个可落地、可扩展、可维护的系统架构，支撑 AI 岗位定制简历平台的核心业务流程。

## 2. 整体架构

### 2.1 系统分层

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              表现层 (Presentation)                       │
│                    Next.js App Router (SSR/CSR)                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           网关层 (Gateway)                               │
│                    NestJS + JWT Authentication                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           业务层 (Business)                              │
│   Auth | Users | Profiles | JobTargets | ResumeVersions | Publish      │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           服务层 (Service)                               │
│              AI Service | PDF Service | Queue Service                   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           数据层 (Data)                                  │
│         PostgreSQL (Prisma) | Redis (BullMQ) | File Storage             │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 技术栈确认

| 层级 | 技术 | 版本要求 |
|------|------|----------|
| 前端框架 | Next.js | 14.x+ |
| 前端语言 | TypeScript | 5.x |
| 前端样式 | Tailwind CSS | 3.x |
| UI 组件 | shadcn/ui | latest |
| 表单处理 | React Hook Form + Zod | latest |
| 状态管理 | Zustand | 4.x |
| 后端框架 | NestJS | 10.x |
| 后端语言 | TypeScript | 5.x |
| 数据库 | PostgreSQL | 15.x+ |
| ORM | Prisma | 5.x |
| 鉴权 | JWT + HttpOnly Cookie | - |
| 缓存 | Redis | 7.x |
| 任务队列 | BullMQ | 5.x |
| AI API | OpenAI | latest |
| PDF 渲染 | Playwright | 1.x |
| 包管理 | pnpm | 8.x+ |

## 3. 核心设计决策

### 3.1 为什么选择 NestJS 而非 Next.js API Routes

| 对比项 | NestJS | Next.js API Routes |
|--------|--------|-------------------|
| 模块化 | 强模块化，依赖注入 | 较弱，需手动组织 |
| 中间件 | 装饰器丰富，AOP 支持 | 简单中间件 |
| 验证 | class-validator 集成 | 需手动集成 Zod |
| 文档 | Swagger 自动生成 | 需手动维护 |
| 测试 | Jest 集成完善 | 需额外配置 |
| 扩展 | 微服务、GraphQL 支持 | 有限 |

**结论**：业务复杂度较高，AI 调用链路复杂，选择 NestJS 更适合长期维护。

### 3.2 为什么选择 JWT + HttpOnly Cookie

| 对比项 | HttpOnly Cookie | Bearer Token (localStorage) |
|--------|-----------------|----------------------------|
| XSS 防护 | 天然防护 | 易受攻击 |
| CSRF 防护 | 需配置 CSRF Token | 天然防护 |
| 跨域 | 需配置 credentials | 简单 |
| 移动端 | 需额外处理 | 友好 |

**结论**：Web 端为主，安全性优先，选择 HttpOnly Cookie。

### 3.3 为什么 AI 不能直接输出 HTML

1. **数据与展示分离**：结构化 JSON 可适配多模板
2. **可编辑性**：JSON 可直接编辑，HTML 解析困难
3. **版本管理**：JSON 易于 diff 和版本对比
4. **一致性校验**：JSON 可做 schema 校验和事实核查
5. **扩展性**：未来可支持多模板、多语言

## 4. 模块依赖关系

```
Auth ──────────────► Users
                       │
                       ▼
Profiles ◄────────────┘
  │
  ├──► EducationRecords
  ├──► WorkExperiences
  ├──► ProjectExperiences
  ├──► SkillRecords
  └──► CertificateRecords

JobTargets ──────────► AI (parseJobDescription)
      │
      └──────────────► AI (buildJobProfile)

ResumeVersions ◄───── Profiles
      │
      ├──► JobTargets
      └──► AI (generateTailoredResume, validateGeneratedResume)

Publish ◄─────────── ResumeVersions
      │
      └──────────────► PDF
```

## 5. 数据流向

### 5.1 简历生成主流程

```
用户输入岗位 JD
    │
    ▼
JobTarget 创建 (状态: INIT)
    │
    ▼
AI 解析 JD (状态: PARSING → PARSE_SUCCESS)
    │
    ▼
AI 构建岗位画像
    │
    ▼
ResumeVersion 创建 (状态: GENERATING)
    │
    ▼
AI 生成定制简历
    │
    ▼
AI 校验结果一致性
    │
    ▼
ResumeVersion 更新 (状态: READY_EDIT)
    │
    ▼
用户在线编辑
    │
    ▼
保存草稿 / 发布
```

### 5.2 AI 调用链路

```
业务 Service
    │
    ▼
构造 AI 输入对象
    │
    ▼
选择 Prompt 模板
    │
    ▼
AI Service.generateStructuredJson()
    │
    ▼
AI Provider 调用大模型 API
    │
    ▼
原始响应 JSON 解析
    │
    ▼
Schema 校验 (Zod)
    │
    ▼
一致性检查
    │
    ▼
记录 AITaskLog
    │
    ▼
返回业务可用结果
```

## 6. 部署架构

### 6.1 开发环境

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   Next.js   │  │   NestJS    │  │ PostgreSQL  │
│   :3000     │  │   :3001     │  │   :5432     │
└─────────────┘  └─────────────┘  └─────────────┘
                       │
                ┌──────┴──────┐
                ▼             ▼
          ┌─────────┐  ┌─────────┐
          │  Redis  │  │ Playwright│
          │  :6379  │  │ (PDF渲染) │
          └─────────┘  └─────────┘
```

### 6.2 生产环境（预留）

```
┌─────────────────────────────────────────────────────┐
│                    CDN / Nginx                       │
└─────────────────────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
   ┌──────────┐    ┌──────────┐    ┌──────────┐
   │ Next.js  │    │ Next.js  │    │ NestJS   │
   │ (SSR)    │    │ (Static) │    │ (API)    │
   └──────────┘    └──────────┘    └──────────┘
                                         │
                              ┌──────────┼──────────┐
                              ▼          ▼          ▼
                        ┌─────────┐ ┌─────────┐ ┌─────────┐
                        │PostgreSQL│ │  Redis  │ │   S3    │
                        └─────────┘ └─────────┘ └─────────┘
```

## 7. 涉及文件/模块

| 模块 | 目录 | 说明 |
|------|------|------|
| 前端 | `apps/web/` | Next.js 应用 |
| 后端 | `apps/api/` | NestJS 应用 |
| 共享 | `packages/shared/` | 类型定义、工具函数 |
| 数据库 | `packages/database/` | Prisma schema |

## 8. 风险与注意事项

### 8.1 已识别风险

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| AI 响应超时 | 用户体验差 | 设置合理超时、异步处理、重试机制 |
| AI 输出格式不稳定 | 解析失败 | Schema 校验、JSON 修复、重试 |
| JD 链接抓取失败 | 无法解析 | 保底支持纯文本输入 |
| PDF 渲染样式错乱 | 导出效果差 | 专用打印模板、测试覆盖 |
| Token 泄露 | 安全风险 | HttpOnly Cookie、短期有效期 |

### 8.2 边界条件

- AI 单次调用超时：30s
- 最大重试次数：3 次
- PDF 文件大小限制：10MB
- 公开链接有效期：永久（可手动撤销）

## 9. 后续计划

1. 完成 Monorepo 目录结构设计
2. 完成 Prisma Schema 设计
3. 完成后端模块拆分设计
4. 完成 AI 模块详细设计
5. 开始 MVP 开发
