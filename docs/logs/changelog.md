# Changelog

## [2026-04-24 08:45] AI 模块完善 - 一致性校验

### 新增
- `validateGeneratedResume` AI 任务方法
- `json-repair.ts` JSON 修复工具
- `consistency-check.ts` 一致性检查工具
- `validate-resume.prompt.ts` 验证 Prompt 模板
- `validate-resume.schema.ts` 验证结果 Schema

### 修改
- `ai.service.ts` 添加 `validateGeneratedResume` 方法
- `prompts/index.ts` 导出验证 Prompt
- `schemas/index.ts` 导出验证 Schema

### 原因
- 实现 AI 结果一致性校验，防止虚构内容
- 满足需求文档中 AI 任务 4 的要求

### 影响范围
- AI 模块完整性提升至 95%
- 简历生成结果可靠性增强

---

## [2026-04-24 08:30] 前端页面补充

### 新增
- `/profiles/[profileId]/skill` 技能管理页面
- `/profiles/[profileId]/certificate` 证书管理页面
- `/jobs/[id]` 岗位详情页面

### 修改
- 修复 `experience.controllers.ts` 导入路径

### 原因
- 补充校验报告中缺失的前端页面
- 完善经历子模块管理

### 影响范围
- 前端页面完整性提升至 95%

---

## [2026-04-23 21:00] 项目初始化

### 新增
- 创建项目根目录结构
- 创建开发日志目录 `docs/logs/`
- 创建日志索引文件 `docs/logs/README.md`
- 创建项目概览 `docs/logs/00-project-overview.md`
- 创建技术架构设计 `docs/logs/01-architecture-design.md`
- 创建 Monorepo 目录结构 `docs/logs/02-monorepo-structure.md`
- 创建 Prisma Schema 设计 `docs/logs/03-prisma-schema.md`
- 创建后端模块拆分 `docs/logs/04-backend-modules.md`
- 创建 AI 模块详细设计 `docs/logs/05-ai-module-design.md`
- 创建 MVP 开发计划 `docs/logs/06-mvp-development-plan.md`

### 原因
- 完成项目整体架构设计
- 为后续开发提供清晰指引

### 影响范围
- 项目整体架构确定
- 技术栈确定
- 开发顺序确定

---

## [2026-04-23 23:00] 阶段 0 完成 - 项目初始化

### 新增
- 云服务器环境配置完成 (Ubuntu 24.04.3 LTS)
- Node.js 20.20.2 安装
- pnpm 10.33.2 安装
- PostgreSQL 16 安装并配置
- Redis 7.0 安装并启动
- Next.js 15 前端应用 (apps/web)
- NestJS 后端应用
- Prisma 数据库包
- 共享类型包

### 数据库
- 创建数据库用户: ai_resume
- 创建数据库: ai_resume
- 创建 11 张数据表:
  - users
  - resume_profiles
  - education_records
  - work_experiences
  - project_experiences
  - skill_records
  - certificate_records
  - job_targets
  - resume_versions
  - resume_publish_records
  - ai_task_logs

### 原因
- 完成阶段 0 项目初始化
- 服务器环境就绪，可以开始开发

---

## [2026-04-24 00:00] 阶段 6-7 完成 - 简历版本管理与发布

### 新增
- 简历版本复制功能 (`POST /resumes/:id/copy`)
- 简历重新生成功能 (`POST /resumes/:id/regenerate`)
- 简历内容更新接口 (`PUT /resumes/:id/content`)
- 发布模块 (`/publish` 接口)
- 公开访问接口 (`GET /public/r/:token`)
- PDF 打印页面 (`GET /pdf/:versionId`, `GET /pdf/public/:token`)
- 前端简历编辑页面 (`/resumes/:id`)
- 前端公开简历页面 (`/r/:token`)

### 原因
- 完成阶段 6 简历版本管理
- 完成阶段 7 发布与 PDF

### 影响范围
- 简历完整生命周期管理
- 公开分享功能可用

---
