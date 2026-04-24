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
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans SC', sans-serif;
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
