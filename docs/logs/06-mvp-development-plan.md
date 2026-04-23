# 一期 MVP 开发计划

## 1. 目标

按阶段完成一期 MVP 所有功能，确保每个阶段可独立验证。

## 2. 开发周期

**预计总工期：31 天**

## 3. 阶段划分

### 阶段 0: 项目初始化 (Day 1-2)

**目标：** 搭建可运行的项目骨架

| 任务 | 产出 |
|------|------|
| 初始化 Monorepo | pnpm-workspace.yaml, package.json |
| 创建 apps/web | Next.js 14 项目 |
| 创建 apps/api | NestJS 项目 |
| 创建 packages/database | Prisma 初始化 |
| 创建 packages/shared | 类型定义 |
| 配置 TypeScript | tsconfig.json |
| 配置 ESLint/Prettier | .eslintrc, .prettierrc |
| 配置环境变量 | .env.example |

**验收标准：**
- [ ] `pnpm dev` 可同时启动前后端
- [ ] 前端访问 localhost:3000 显示页面
- [ ] 后端访问 localhost:3001/api 返回响应

---

### 阶段 1: 基础设施 (Day 3-5)

**目标：** 完成数据库、缓存、公共模块

| 任务 | 产出 |
|------|------|
| Prisma Schema 完善 | schema.prisma, 迁移文件 |
| Prisma Service | prisma.service.ts |
| Redis 配置 | redis.module.ts |
| 全局异常处理 | http-exception.filter.ts |
| 响应拦截器 | transform.interceptor.ts |
| 验证管道 | validation.pipe.ts |
| Swagger 文档 | main.ts 配置 |

**验收标准：**
- [ ] 数据库迁移成功
- [ ] Prisma Client 可正常使用
- [ ] API 返回统一格式
- [ ] Swagger 文档可访问

---

### 阶段 2: 用户认证 (Day 6-8)

**目标：** 完成注册、登录、JWT 鉴权

| 任务 | 产出 |
|------|------|
| 注册接口 | POST /auth/register |
| 登录接口 | POST /auth/login |
| 登出接口 | POST /auth/logout |
| 当前用户接口 | GET /auth/me |
| JWT 策略 | jwt.strategy.ts |
| Auth Guard | jwt-auth.guard.ts |
| 前端登录页 | /login |
| 前端注册页 | /register |

**验收标准：**
- [ ] 用户可注册
- [ ] 用户可登录
- [ ] JWT 鉴权正常
- [ ] 受保护接口需要登录

---

### 阶段 3: 主档案管理 (Day 9-12)

**目标：** 完成主档案及所有经历模块

| 任务 | 产出 |
|------|------|
| 档案 CRUD | /profiles 接口 |
| 教育经历 CRUD | /profiles/:id/education |
| 工作经历 CRUD | /profiles/:id/work |
| 项目经历 CRUD | /profiles/:id/project |
| 技能 CRUD | /profiles/:id/skill |
| 证书 CRUD | /profiles/:id/certificate |
| 前端档案页 | /profile |
| 前端经历组件 | 表单组件 |

**验收标准：**
- [ ] 可创建主档案
- [ ] 可添加各类经历
- [ ] 可编辑删除
- [ ] 前端页面正常展示

---

### 阶段 4: 岗位模块 (Day 13-15)

**目标：** 完成岗位输入和解析

| 任务 | 产出 |
|------|------|
| 岗位创建 | POST /job-targets |
| 岗位列表 | GET /job-targets |
| 岗位详情 | GET /job-targets/:id |
| JD 抓取服务 | 抓取逻辑 |
| 岗位删除 | DELETE /job-targets/:id |
| 前端岗位页 | /jobs |
| 前端解析确认页 | /jobs/:id |

**验收标准：**
- [ ] 可输入链接或 JD 文本
- [ ] 链接可抓取内容
- [ ] 岗位列表正常展示

---

### 阶段 5: AI 集成 (Day 16-19)

**目标：** 完成 AI 调用封装和核心功能

| 任务 | 产出 |
|------|------|
| Provider 接口 | ai.provider.interface.ts |
| OpenAI Provider | openai.provider.ts |
| 岗位解析 Prompt | parse-job.prompt.ts |
| 岗位画像 Prompt | build-job-profile.prompt.ts |
| 简历生成 Prompt | generate-resume.prompt.ts |
| 校验 Prompt | validate-resume.prompt.ts |
| Schema 定义 | schemas/*.ts |
| AI Service | ai.service.ts |
| 日志记录 | AITaskLog 写入 |
| 一致性检查 | consistency-check.ts |

**验收标准：**
- [ ] AI 可解析 JD
- [ ] AI 可生成简历
- [ ] 输出符合 Schema
- [ ] 日志正常记录

---

### 阶段 6: 简历版本管理 (Day 20-23)

**目标：** 完成版本创建、编辑、管理

| 任务 | 产出 |
|------|------|
| 版本创建 | POST /resume-versions |
| 版本列表 | GET /resume-versions |
| 版本详情 | GET /resume-versions/:id |
| 版本编辑 | PATCH /resume-versions/:id |
| 版本复制 | POST /resume-versions/:id/copy |
| 重新生成 | POST /resume-versions/:id/regenerate |
| 前端版本列表 | /resumes |
| 前端编辑页 | /resumes/:id |
| 前端预览组件 | 预览组件 |

**验收标准：**
- [ ] 可创建简历版本
- [ ] AI 生成流程完整
- [ ] 可在线编辑
- [ ] 可复制为新草稿

---

### 阶段 7: 发布与 PDF (Day 24-26)

**目标：** 完成发布和 PDF 导出

| 任务 | 产出 |
|------|------|
| 发布接口 | POST /resume-versions/:id/publish |
| 公开访问 | GET /public/r/:token |
| PDF 生成服务 | pdf.service.ts |
| PDF 模板 | resume-template.html |
| PDF 下载 | GET /public/r/:token/pdf |
| 前端发布组件 | 发布确认 |
| 公开简历页 | /r/[token] |

**验收标准：**
- [ ] 可发布简历
- [ ] 公开链接可访问
- [ ] PDF 可正常下载
- [ ] PDF 格式正确

---

### 阶段 8: 测试与优化 (Day 27-31)

**目标：** 完善测试、优化体验

| 任务 | 产出 |
|------|------|
| 单元测试 | Jest 测试文件 |
| E2E 测试 | 测试脚本 |
| 错误处理完善 | 边界情况处理 |
| 性能优化 | 加载优化 |
| UI 完善 | 样式调整 |
| 文档完善 | README, 部署文档 |

**验收标准：**
- [ ] 核心测试通过
- [ ] 无明显 Bug
- [ ] 用户体验流畅

---

## 4. 里程碑

| 里程碑 | 完成标志 | 预计时间 |
|--------|----------|----------|
| M1 | 项目骨架可运行 | Day 2 |
| M2 | 用户认证完成 | Day 8 |
| M3 | 主档案管理完成 | Day 12 |
| M4 | 岗位模块完成 | Day 15 |
| M5 | AI 集成完成 | Day 19 |
| M6 | 版本管理完成 | Day 23 |
| M7 | 发布流程完成 | Day 26 |
| M8 | MVP 可上线 | Day 31 |

## 5. 风险与注意事项

### 5.1 技术风险

| 风险 | 缓解措施 |
|------|----------|
| AI API 不稳定 | 设置超时、重试机制 |
| PDF 渲染问题 | 专用模板、充分测试 |
| 抓取被限制 | 保底纯文本输入 |

### 5.2 进度风险

| 风险 | 缓解措施 |
|------|----------|
| 任务估时不准 | 预留缓冲时间 |
| 依赖阻塞 | 并行开发、Mock 数据 |

## 6. 后续计划

1. 按阶段执行开发
2. 每完成一个阶段更新日志
3. 遇到问题记录到 issues.md
4. 关键决策记录到 decisions.md
