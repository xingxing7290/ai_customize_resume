# AI 岗位定制简历平台 - 开发日志目录

## 目录说明

本目录用于统一管理项目开发过程中的所有日志、设计文档、变更记录和技术决策。

## 日志文件结构

| 文件名 | 用途 |
|--------|------|
| `README.md` | 本文件，说明日志目录结构 |
| `00-project-overview.md` | 项目目标、范围、MVP 边界、产品主线 |
| `01-architecture-design.md` | 整体技术架构、模块关系、技术选型原因 |
| `02-monorepo-structure.md` | 仓库结构、目录划分、模块归属 |
| `03-prisma-schema.md` | 数据库模型、表关系、枚举、索引设计 |
| `04-backend-modules.md` | 后端模块拆分、职责、依赖关系、接口归属 |
| `05-ai-module-design.md` | AI 模块架构、Prompt 分层、Provider 设计 |
| `06-mvp-development-plan.md` | 一期 MVP 开发顺序、里程碑、阶段任务 |
| `07-api-design.md` | 接口定义、请求响应、错误码 |
| `08-frontend-pages.md` | 页面清单、页面职责、交互说明 |
| `09-pdf-publish-flow.md` | 发布流程、公开访问、PDF 导出方案 |
| `10-testing-plan.md` | 测试范围、单元测试建议、风险点测试 |
| `changelog.md` | 所有重要变更，按时间追加 |
| `decisions.md` | 关键技术决策和原因 |
| `issues.md` | 当前遗留问题、风险、阻塞项 |

## 阅读顺序建议

1. 先读 `00-project-overview.md` 了解项目背景
2. 再读 `01-architecture-design.md` 了解整体架构
3. 按需查阅其他专项文档
4. `changelog.md` 用于追踪变更历史
5. `decisions.md` 用于理解技术选型原因
6. `issues.md` 用于了解当前风险和待办

## 更新规则

- 每个开发阶段完成后，必须更新对应日志文件
- 所有变更必须记录到 `changelog.md`
- 技术决策必须记录到 `decisions.md`
- 发现的问题和风险必须记录到 `issues.md`
