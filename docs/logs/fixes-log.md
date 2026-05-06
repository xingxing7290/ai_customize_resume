# 项目整改记录

## 日期: 2026-04-24

---

## 问题 1: 前端字体 403 错误

### 问题描述

用户访问登录页面时，字体文件 `http://113.44.50.108:3000/__nextjs_font/geist-latin.woff2` 返回 403 Forbidden 错误。

### 原因分析

用户的本地代理 (127.0.0.1:19808) 拦截了字体文件请求，导致加载失败。

### 解决方案

1. 移除 `apps/web/src/app/layout.tsx` 中的 Geist 字体导入
2. 更新 `apps/web/src/app/globals.css` 使用系统字体栈:

```css
font-family:
  -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue",
  Arial, "Noto Sans SC", sans-serif;
```

### 状态

✅ 已修复

---

## 问题 2: API 缺少 package.json

### 问题描述

`apps/api/package.json` 文件不存在，导致无法安装依赖和启动后端服务。

### 解决方案

创建完整的 `apps/api/package.json` 文件，包含所有必要的 NestJS 依赖。

### 状态

✅ 已修复

---

## 问题 3: API 缺少 nest-cli.json 和 tsconfig.json

### 问题描述

`apps/api/nest-cli.json` 和 `apps/api/tsconfig.json` 配置文件缺失。

### 解决方案

创建这两个配置文件。

### 状态

✅ 已修复

---

## 问题 4: Prisma Schema 缺失

### 问题描述

`apps/api/prisma/schema.prisma` 文件不存在，导致无法生成 Prisma Client。

### 解决方案

根据代码中的模型使用情况，创建完整的 Prisma schema，包含以下模型:

- User (用户)
- ResumeProfile (简历档案)
- EducationRecord (教育经历)
- WorkExperience (工作经历)
- ProjectExperience (项目经历)
- SkillRecord (技能)
- CertificateRecord (证书)
- JobTarget (求职目标)
- ResumeVersion (简历版本)

### 状态

✅ 已修复

---

## 问题 5: 缺少 bcryptjs 依赖

### 问题描述

后端启动时报错 `Cannot find module 'bcryptjs'`。

### 解决方案

```bash
pnpm add bcryptjs
```

### 状态

✅ 已修复

---

## 问题 6: PostgreSQL 数据库未运行

### 问题描述

后端启动时报错 `Can't reach database server at localhost:5432`。

### 原因

PostgreSQL 服务未启动。

### 解决方案

需要用户手动启动 PostgreSQL 服务:

```bash
# Linux
sudo systemctl start postgresql

# 或使用 Docker
docker run -d --name postgres -e POSTGRES_PASSWORD=your_password -e POSTGRES_DB=ai_resume -p 5432:5432 postgres:15
```

### 状态

⏳ 待用户处理

---

## 配置文件清单

### 已创建/修复的文件:

1. `apps/api/package.json` - NestJS 项目配置
2. `apps/api/nest-cli.json` - NestJS CLI 配置
3. `apps/api/tsconfig.json` - TypeScript 配置
4. `apps/api/prisma/schema.prisma` - 数据库模型定义
5. `apps/api/.env` - 环境变量配置

### 需要用户配置:

1. 数据库连接字符串 (`DATABASE_URL`)
2. OpenAI API Key (`OPENAI_API_KEY`)
3. JWT 密钥 (`JWT_SECRET`)

---

## 启动步骤

1. 启动 PostgreSQL 数据库
2. 运行数据库迁移: `cd apps/api && npx prisma migrate dev`
3. 启动后端: `cd apps/api && pnpm run dev`
4. 启动前端: `cd apps/web && pnpm run dev`

---

## 测试账号

注册新账号后可使用，暂无预设测试账号。

---

## 问题 7: 登录按钮点击无反应

### 日期: 2026-04-24

### 问题描述

点击登录按钮后没有任何反应，API 请求未发送，页面未跳转。

### 问题原因

React hydration 失败 - 服务端渲染的 HTML 与客户端 JavaScript 不匹配，导致事件处理器（onSubmit）未正确绑定到 DOM 元素。

### 解决方案

1. 将 form 的 onSubmit 改为 button 的 onClick 事件
2. 添加 `mounted` 状态防止服务端渲染不匹配
3. 按钮 type 从 "submit" 改为 "button"
4. 使用 useEffect 确保 client-side hydration 完成

### 修改文件

- `apps/web/src/app/(auth)/login/page.tsx`

### 测试结果

- ✅ 按钮点击触发 API 请求
- ✅ API 返回 200 状态码和 accessToken
- ✅ Token 保存到 localStorage
- ✅ 页面成功跳转到 /profiles

### 状态

✅ 已修复

---

## 问题 8: 创建档案无法保存

### 日期: 2026-04-24

### 问题描述

在 profiles 页面点击"新建档案"填写信息后，点击"创建"按钮无法保存档案。

### 问题原因

1. API URL 配置错误 - 使用 `localhost:3001` 而服务器上浏览器无法访问 localhost
2. 同样的 React hydration 问题 - form onSubmit 未正确绑定

### 解决方案

1. 修改 API_BASE_URL 默认值从 `localhost:3001` 改为 `113.44.50.108:3001`
2. 将 profiles 页面的 form onSubmit 改为 button onClick
3. 添加 mounted 状态处理

### 修改文件

- `apps/web/src/lib/api.ts`
- `apps/web/src/app/(dashboard)/profiles/page.tsx`

### 状态

✅ 已修复

---

## 问题 9: 服务器无法连接 GitHub

### 日期: 2026-04-24

### 问题描述

服务器执行 `git pull` 时无法连接到 GitHub，报错：`Failed to connect to github.com port 443`

### 解决方案

使用 SSH 直接传输文件到服务器：

```bash
ssh root@113.44.50.108 "cat > /path/to/file" < /local/path/to/file
```

### 状态

✅ 已解决

---

## 关键发现

### Next.js 16 + Turbopack Hydration 问题

在 Next.js 16 使用 Turbopack 时，form 的 onSubmit 事件可能无法正确绑定。建议：

- 使用 button onClick 替代 form onSubmit
- 添加 mounted 状态确保 client-side rendering
- 使用 `type="button"` 而不是 `type="submit"`

### API URL 配置

部署到服务器时，前端 API URL 必须使用服务器的外网地址，不能使用 localhost。

---

## 问题 10: 添加 PDF 简历导入功能

### 日期: 2026-05-04

### 功能描述

在新建档案页面添加 PDF 简历导入功能，用户可以上传 PDF 简历文件，系统自动解析并填充表单字段。

### 实现方案

#### 后端实现

1. 创建 PDF 解析 prompt (`apps/api/src/modules/ai/prompts/parse-resume.prompt.ts`)
2. 创建解析简历 schema (`apps/api/src/modules/ai/schemas/parse-resume.schema.ts`)
3. 在 AiService 添加 `parseResumeFromText` 方法
4. 在 ProfilesService 添加 `importFromPdf` 方法
5. 在 ProfilesController 添加 `/profiles/import-pdf` 端点
6. 安装 `pdf-parse` 依赖用于提取 PDF 文本
7. 添加 pdf-parse 类型声明 (`apps/api/src/types/pdf-parse.d.ts`)

#### 前端实现

1. 在 profiles 页面添加 PDF 导入按钮
2. 更新 api.ts 添加 `importPdf` 方法
3. 添加导入状态提示和成功消息

### 修改文件

- `apps/api/src/modules/ai/prompts/parse-resume.prompt.ts` (新建)
- `apps/api/src/modules/ai/prompts/index.ts`
- `apps/api/src/modules/ai/schemas/parse-resume.schema.ts` (新建)
- `apps/api/src/modules/ai/schemas/index.ts`
- `apps/api/src/modules/ai/ai.service.ts`
- `apps/api/src/modules/profiles/profiles.controller.ts`
- `apps/api/src/modules/profiles/profiles.service.ts`
- `apps/api/src/modules/profiles/profiles.module.ts`
- `apps/api/src/types/pdf-parse.d.ts` (新建)
- `apps/web/src/app/(dashboard)/profiles/page.tsx`
- `apps/web/src/lib/api.ts`

### 状态

⏳ 代码已完成，等待服务器部署

---

## 问题 11: 完善 PDF 简历导入落库流程

### 日期: 2026-05-06

### 问题描述

上一次提交已添加 PDF 简历导入入口，但导入结果只返回给前端并填充基础表单，教育经历、工作经历、项目经历、技能和证书没有真正保存为档案关联数据；同时后端缺少稳定的 `pdf-parse` 运行依赖和无 AI 配置时的降级处理。

### 问题原因

1. `ProfilesService.importFromPdf` 只返回 AI 解析结果，没有创建 `ResumeProfile` 和关联记录。
2. 前端导入成功后仍停留在手动保存基础资料的流程。
3. `pdf-parse` 未固定到兼容当前 Node/Nest 构建方式的版本。
4. 用户未配置 AI Key 时，PDF 导入会直接失败。

### 解决方案

1. 后端导入 PDF 后直接创建档案，并批量写入教育、工作、项目、技能、证书记录。
2. 导入时读取用户 AI 设置；AI 不可用时使用本地兜底解析姓名、邮箱、电话、摘要和常见技术栈。
3. 将 `pdf-parse` 固定为 `1.1.1`，改为静态导入，避免动态 import 触发包内测试入口。
4. 前端导入成功后刷新档案列表，并显示导入的关联记录数量。

### 修改的文件

- `apps/api/package.json`
- `pnpm-lock.yaml`
- `package-lock.json`
- `apps/api/src/modules/ai/ai.service.ts`
- `apps/api/src/modules/profiles/profiles.controller.ts`
- `apps/api/src/modules/profiles/profiles.module.ts`
- `apps/api/src/modules/profiles/profiles.service.ts`
- `apps/web/src/app/(dashboard)/profiles/page.tsx`

### 测试结果

- 本地 `apps/api` 执行 `npm run build` 通过。
- 本地 `apps/api` 执行 `npm test -- --runInBand` 通过。
- 本地 `apps/web` 执行 TypeScript 检查通过。
- 本地针对 `profiles/page.tsx` 执行 ESLint 无错误，仅保留项目已有的 `<img>` 警告。
- 服务器 `apps/api` 执行 `pnpm build` 通过。
- 服务器 `apps/web` 执行 `pnpm build` 通过。
- 已重启服务器 API `http://113.44.50.108:3001` 和 Web `http://113.44.50.108:3000`。
- 访问 `http://113.44.50.108:3000/profiles` 返回 200，访问 `http://113.44.50.108:3001/api/docs` 返回 200，受保护的 `/profiles` API 未登录返回 401，符合预期。

---

## 问题 12: PDF 简历导入解析耗时过长且结果为空

### 日期: 2026-05-06

### 问题描述

用户上传 PDF 简历后，页面长时间停留在解析中。服务器最终会创建档案，但导入结果中姓名、邮箱、教育、工作、项目、技能、证书等字段可能为空。

### 问题原因

1. 服务器日志显示一次 `/profiles/import-pdf` 请求耗时约 50.5 秒。
2. `profile_pdf_import_started` 到 `profile_pdf_import_parsed` 间隔约 49 秒，说明耗时集中在 AI 简历结构化解析阶段。
3. AI 返回了空结构，但后端只在异常时走本地兜底；“AI 正常返回但内容为空”没有触发兜底。
4. 本地兜底解析规则过弱，只能提取少量基础信息，无法覆盖常见中文简历段落。

### 解决方案

1. `parseResumeFromText` 增加 AI 解析超时，默认 `RESUME_PARSE_AI_TIMEOUT_MS=15000`。
2. AI 超时、失败或返回空结构时，使用本地解析结果兜底并写入 AI 任务日志。
3. 增强本地解析能力，支持姓名、邮箱、电话、所在地、个人简介、教育经历、工作经历、项目经历、技能和证书的常见中文段落。
4. AI 返回部分字段时，后端会用本地解析补齐缺失数组和基础字段。

### 修改的文件

- `apps/api/src/modules/ai/ai.service.ts`

### 测试结果

- 本地 `apps/api` 执行 `npm run build` 通过。
- 本地 `apps/api` 执行 `npm test -- --runInBand` 通过。
- 本地使用模拟中文简历文本验证兜底解析，可提取姓名、邮箱、教育日期、技能和证书。
- 服务器 `apps/api` 执行 `pnpm build` 通过并已重启。
- 在服务器生成测试 PDF `/tmp/codex-complete-resume.pdf`，内容包含 2 条教育经历、2 条工作经历、2 条项目经历、技能和证书。
- 使用服务器 `pdf-parse` 验证测试 PDF 可提取 2 页、1615 字符文本，教育、工作、项目段落均存在。
- 直接调用服务器本地兜底解析，返回 `educationRecords=2`、`workExperiences=2`、`projectExperiences=2`。
- 使用服务器真实 PDF 通过 `/profiles/import-pdf` 上传测试，接口约 185ms 返回成功，创建档案及关联记录。
- 接口返回并校验通过：教育 2 条、工作 2 条、项目 2 条、技能 15 条、证书 1 条；学校、公司、项目名称均与 PDF 内容匹配。
- 服务器日志确认最终导入请求在 `2026-05-06T12:46:50Z` 完成，`profile_pdf_import_parsed` 和 `profile_pdf_import_created` 均记录教育 2、工作 2、项目 2，HTTP 请求耗时 178ms。
