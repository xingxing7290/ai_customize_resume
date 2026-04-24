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
