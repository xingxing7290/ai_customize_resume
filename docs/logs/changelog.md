# Changelog

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
