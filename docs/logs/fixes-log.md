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
  -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue',
  Arial, 'Noto Sans SC', sans-serif;
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

---

## 问题 13: PDF 导入未登录状态返回 401 且日期分隔标题解析错位

### 日期: 2026-05-06

### 问题描述

用户在页面上传 PDF 时，请求 `http://113.44.50.108:3001/profiles/import-pdf` 立即返回 `401 Unauthorized`。同时服务器回归测试发现 `2013-2015 | 学校 | 学位 | 专业` 这类日期开头的 PDF 文本会把日期误识别为学校、公司或项目名称。

### 问题原因

1. 服务器日志显示用户浏览器在上传前访问 `/profiles`、`/jobs`、`/settings/ai` 已连续返回 401，说明页面处于未登录或 token 失效状态。
2. 前端仪表盘没有在进入页面时主动校验 `/auth/me`，失效登录态下仍可点击 PDF 上传。
3. 通用 `|` 分隔解析没有识别第一段日期范围，导致日期开头的教育、工作、项目标题字段整体左移。

### 解决方案

1. 前端 API 客户端在任意请求或上传遇到 401 时清理 `accessToken`，并跳转到 `/login?next=当前路径`。
2. 仪表盘布局加载时先调用 `/auth/me` 验证会话，未登录时直接返回登录页。
3. 登录页支持 `next` 参数，重新登录后回到原页面。
4. 后端本地 PDF 兜底解析新增日期开头标题识别，教育、工作、项目经历会跳过第一段日期后再映射学校、公司、项目名称等字段。

### 修改的文件

- `apps/web/src/lib/api.ts`
- `apps/web/src/app/(dashboard)/layout.tsx`
- `apps/web/src/app/(auth)/login/page.tsx`
- `apps/api/src/modules/ai/ai.service.ts`

### 测试结果

- 本地 `apps/api` 执行 `npm run build` 通过。
- 本地 `apps/api` 执行 `npm test -- --runInBand` 通过。
- 服务器 `apps/api` 执行 `pnpm build` 通过并已重启。
- 服务器 `apps/web` 执行 `pnpm build` 通过并已重启。
- 使用 Puppeteer 访问未登录的 `http://127.0.0.1:3000/profiles`，确认自动跳转到 `http://127.0.0.1:3000/login?next=%2Fprofiles`。
- 在服务器生成完整测试 PDF `/tmp/full-profile-import-regression.pdf`，内容包含姓名、邮箱、电话、地点、摘要、2 条教育、2 条工作、2 条项目、技能和证书。
- 未带 token 上传 `/profiles/import-pdf` 返回 401，符合安全预期；带 token 上传同一 PDF 返回 201。
- 真实上传解析结果校验通过：姓名 `Daniel Zhang`、邮箱 `daniel.zhang@example.com`、教育 2 条、工作 2 条、项目 2 条、技能 19 条、证书 1 条；学校、公司、项目名称均与 PDF 内容匹配。

---

## 问题 14: PDF 中项目型内容被误归为工作经历

### 日期: 2026-05-06

### 问题描述

用户上传的 PDF 中，“工作经历”段落实际包含多个项目经历，例如 `4G 设备管理 APP 与嵌入式设备通信项目 程序开发工程师`、`产品线上说明书平台与 AI 知识库系统 平台搭建工程师`。导入后部分内容被落到工作经历，并出现日期被当成公司名、项目名的情况。

### 问题原因

1. PDF 文本中存在“项目标题在日期上一行”和“日期在项目标题上一行”两种版式，原块切分只按日期行开始，容易丢失标题或把描述句当标题。
2. AI 可能把“工作经历”标题下的项目型内容返回到 `workExperiences`，旧逻辑合并后直接落库，没有二次分类。
3. 本地兜底解析只从“项目经历”段提取项目，没有从“工作经历”段识别项目型块。

### 解决方案

1. 增强 PDF 本地块切分：日期行前后都会判断项目标题，避免把上一条描述或日期本身当成标题。
2. 工作经历本地解析会过滤项目型块；项目经历本地解析会额外从工作经历段抽取项目型块。
3. `parseResumeFromText` 合并 AI 和本地结果后新增二次分桶：当工作经历的公司字段是日期，或内容含项目、平台、系统、APP、设备、网关、上位机等项目特征且不含公司特征时，自动转入项目经历。
4. 项目标题会拆分常见角色后缀，如程序开发工程师、平台搭建工程师、嵌入式软件工程师、软件开发与优化工程师等。

### 修改的文件

- `apps/api/src/modules/ai/ai.service.ts`

### 测试结果

- 本地 `apps/api` 执行 `npm run build` 通过。
- 本地 `apps/api` 执行 `npm test -- --runInBand` 通过。
- 服务器 `apps/api` 执行 `pnpm build` 通过并已重启。
- 在服务器生成测试 PDF `/tmp/project-under-work-regression.pdf`，将用户反馈的项目型内容放在“工作经历”段中。
- 通过服务器 `/profiles/import-pdf` 真实上传测试，接口返回 201，耗时约 1.5 秒。
- 校验结果：教育 1 条、工作 0 条、项目 6 条、技能 14 条、证书 1 条；项目中包含 `4G 设备管理 APP 与嵌入式设备通信项目`、`产品线上说明书平台与 AI 知识库系统`、`上位机软件开发与优化项目`，未再出现日期作为公司名或项目名。

---

## 问题 15: PDF 项目导入不完整且学习经历误入工作经历

### 日期: 2026-05-12

### 问题描述

用户反馈 PDF 简历导入后仍有大量项目没有导入成功，并且学习经历可能进入工作经历。服务器日志显示用户真实导入曾解析为教育 2 条、工作 0 条、项目 6 条，但复杂 PDF 中项目数量仍不足。

### 问题原因

1. `mergeParsedResume` 之前在 AI 返回非空项目数组时直接使用 AI 结果，丢弃本地兜底解析出的额外项目。
2. 本地项目兜底解析最多只保留 8 条项目，项目较多时会被截断。
3. “学习经历/学习背景”没有作为教育段标题处理，AI 或 PDF 文本布局异常时可能被误分到工作经历。
4. 项目型内容位于“工作经历”段且后面又有“项目经历”标题时，旧规则只扫描工作 section，部分项目块没有进入兜底项目集合。

### 解决方案

1. AI 结果和本地兜底结果改为合并去重，不再二选一。
2. 项目兜底上限从 8 条提升到 30 条，并额外从全文日期块中扫描项目型内容。
3. 增加“学习经历/学习背景”教育标题识别，并在最终二次分桶中把误入工作或项目的教育记录转回教育经历。
4. 过滤页码、日期、描述句等无效项目名，补充全栈开发工程师、后端开发工程师、嵌入式开发工程师等角色拆分。

### 修改的文件

- `apps/api/src/modules/ai/ai.service.ts`

### 测试结果

- 本地 `apps/api` 执行 `npm run build` 通过。
- 本地 `apps/api` 执行 `npm test -- --runInBand` 通过。
- 服务器 `apps/api` 执行 `pnpm build` 通过并已重启。
- 在服务器生成分页测试 PDF `/tmp/pdf-import-education-project-regression-v2.pdf`，包含“工作经历”段中的学习经历、公司工作、12 条项目和单独项目经历段。
- 使用服务器 `/profiles/import-pdf` 真实上传验证通过：教育 1 条、工作 0 条、项目 12 条、技能 16 条、证书 1 条。
- 校验确认 `华中科技大学` 留在教育经历，没有进入工作经历；项目包含 `4G 设备管理 APP 与嵌入式设备通信项目`、`产品线上说明书平台与 AI 知识库系统`、`工业网关远程维护平台`、`MQTT 物联网数据采集平台项目` 等，未出现页码或日期作为项目名。

---

## 问题 16: 强化 AI 简历经历分类后再导入

### 日期: 2026-05-12

### 问题描述

用户提出 PDF 简历导入可以根据 AI 进行分类后再导入，避免仅按 PDF 小标题或本地规则分类导致经历落错表。

### 解决方案

1. 强化 AI 简历解析 prompt：先进行经历分类，再提取字段，不机械相信 PDF 小标题。
2. 明确分类规则：学校/学历/专业信息必须进入教育经历；只有真实雇主和任职关系才进入工作经历；项目、平台、系统、APP、设备、网关、上位机、知识库等内容必须进入项目经历。
3. 要求 AI 不把日期、页码、纯数字或描述句作为公司、学校、项目名称。
4. 更新结构化 schema 字段说明，让 `company` 明确表示真实雇主，`project.name` 明确表示项目/平台/系统/产品名称。
5. 保留本地二次分桶作为兜底纠错，防止 AI 少提、错分或返回稀疏结果。

### 修改的文件

- `apps/api/src/modules/ai/prompts/parse-resume.prompt.ts`
- `apps/api/src/modules/ai/schemas/parse-resume.schema.ts`

### 测试结果

- 本地 `apps/api` 执行 `npm run build` 通过。
- 本地 `apps/api` 执行 `npm test -- --runInBand` 通过。
- 服务器 `apps/api` 执行 `pnpm build` 通过并已重启。
- 复用服务器分页 PDF `/tmp/pdf-import-education-project-regression-v2.pdf` 真实上传验证通过：教育 1 条、工作 0 条、项目 12 条、技能 16 条、证书 1 条。
- 校验确认学习经历没有进入工作经历，项目名称和角色保持正确拆分。
