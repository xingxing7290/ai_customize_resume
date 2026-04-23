# AI 简历定制平台

智能生成针对特定岗位的定制简历

## 功能特性

- 用户认证 (注册/登录/JWT)
- 主档案管理 (个人信息、教育、工作、项目、技能、证书)
- 求职目标管理 (JD 输入、链接抓取)
- AI 简历生成 (OpenAI 集成)
- 简历版本管理 (创建、编辑、复制、重新生成)
- 发布与分享 (公开链接、打印/PDF)

## 技术栈

- **前端**: Next.js 15, React, TypeScript, Tailwind CSS
- **后端**: NestJS, TypeScript
- **数据库**: PostgreSQL 16 + Prisma ORM
- **缓存**: Redis 7
- **AI**: OpenAI API
- **构建**: Turborepo + pnpm workspace

## 项目结构

```
ai_customize_resume/
├── apps/
│   ├── web/          # Next.js 前端
│   └── api/          # NestJS 后端
├── packages/
│   ├── database/     # Prisma Schema
│   └── shared/       # 共享类型
├── docs/
│   └ logs/          # 开发日志
└── turbo.json
```

## 快速开始

### 环境要求

- Node.js 20+
- pnpm 10+
- PostgreSQL 16
- Redis 7

### 安装

```bash
# 克隆项目
git clone https://github.com/xingxing7290/ai_customize_resume.git
cd ai_customize_resume

# 安装依赖
pnpm install

# 配置环境变量
cp apps/api/.env.example apps/api/.env
# 编辑 .env 文件配置数据库、Redis、OpenAI

# 数据库迁移
cd packages/database
pnpm prisma migrate dev

# 启动开发服务器
pnpm dev
```

### 访问

- 前端: http://localhost:3000
- 后端 API: http://localhost:3001
- Swagger 文档: http://localhost:3001/api/docs

## API 接口

### 认证
- `POST /auth/register` - 注册
- `POST /auth/login` - 登录
- `POST /auth/logout` - 登出
- `GET /auth/me` - 获取当前用户

### 主档案
- `POST /profiles` - 创建档案
- `GET /profiles` - 获取档案列表
- `GET /profiles/:id` - 获取档案详情
- `PUT /profiles/:id` - 更新档案
- `DELETE /profiles/:id` - 删除档案

### 求职目标
- `POST /jobs` - 创建求职目标
- `GET /jobs` - 获取列表
- `GET /jobs/:id` - 获取详情
- `PUT /jobs/:id` - 更新
- `DELETE /jobs/:id` - 删除

### 简历版本
- `POST /resumes` - 创建简历版本
- `GET /resumes` - 获取列表
- `GET /resumes/:id` - 获取详情
- `PUT /resumes/:id` - 更新
- `POST /resumes/:id/copy` - 复制
- `POST /resumes/:id/regenerate` - 重新生成
- `DELETE /resumes/:id` - 删除

### 发布
- `POST /publish/:versionId` - 发布简历
- `DELETE /publish/:versionId` - 取消发布
- `GET /public/r/:token` - 公开访问简历

### PDF
- `GET /pdf/:versionId` - 打印页面 (需登录)
- `GET /pdf/public/:token` - 公开打印页面

## 部署

项目已部署在云服务器:

- 服务器 IP: 113.44.50.108
- 前端: http://113.44.50.108:3000
- 后端: http://113.44.50.108:3001

## 开发日志

详见 `docs/logs/changelog.md`

## License

MIT