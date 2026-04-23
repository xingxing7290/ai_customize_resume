# Monorepo 目录结构

## 1. 目标

设计清晰的 Monorepo 目录结构，支持前后端分离开发、代码共享、依赖管理。

## 2. 目录结构总览

```
ai_customize_resume/
├── apps/                       # 应用程序
│   ├── web/                    # Next.js 前端应用
│   └── api/                    # NestJS 后端应用
├── packages/                   # 共享包
│   ├── shared/                 # 共享类型和工具
│   └── database/               # Prisma 数据库
├── docs/                       # 文档
│   └── logs/                   # 开发日志
├── pnpm-workspace.yaml         # Workspace 配置
├── package.json                # 根配置
├── turbo.json                  # Turborepo 配置
├── .gitignore
├── .env.example
└── README.md
```

## 3. 前端目录 (apps/web)

```
apps/web/
├── app/                        # Next.js App Router
│   ├── (auth)/                 # 认证页面组
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/            # 主应用页面组
│   │   ├── layout.tsx
│   │   ├── page.tsx            # 工作台
│   │   ├── profile/            # 主档案
│   │   ├── jobs/               # 岗位管理
│   │   ├── resumes/            # 简历版本
│   │   └── settings/
│   └── r/[token]/page.tsx      # 公开简历
├── components/
│   ├── ui/                     # shadcn/ui
│   ├── layout/                 # 布局组件
│   ├── profile/                # 档案组件
│   ├── resume/                 # 简历组件
│   ├── job/                    # 岗位组件
│   └── common/                 # 通用组件
├── features/                   # 业务功能模块
├── lib/                        # 工具库
├── hooks/                      # 全局 Hooks
├── services/                   # API 服务
├── types/                      # 类型定义
├── stores/                     # Zustand 状态
├── styles/
├── public/
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

### 3.1 页面路由说明

| 路由 | 页面 | 说明 |
|------|------|------|
| `/login` | 登录页 | 用户登录 |
| `/register` | 注册页 | 用户注册 |
| `/` | 工作台首页 | 概览、快捷入口 |
| `/profile` | 主档案页 | 基本信息、经历管理 |
| `/profile/education` | 教育经历 | CRUD |
| `/profile/work` | 工作经历 | CRUD |
| `/profile/project` | 项目经历 | CRUD |
| `/profile/skill` | 技能 | CRUD |
| `/profile/certificate` | 证书 | CRUD |
| `/jobs` | 岗位列表 | 已添加的岗位 |
| `/jobs/new` | 新增岗位 | 输入 JD |
| `/jobs/[id]` | 岗位详情 | 解析结果 |
| `/resumes` | 简历列表 | 版本管理 |
| `/resumes/new` | 新建简历 | 选择岗位生成 |
| `/resumes/[id]` | 编辑页 | 在线编辑 |
| `/r/[token]` | 公开页 | 公开访问 |

## 4. 后端目录 (apps/api)

```
apps/api/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── modules/
│   │   ├── auth/               # 认证模块
│   │   ├── users/              # 用户模块
│   │   ├── profiles/           # 主档案模块
│   │   ├── job-targets/        # 岗位模块
│   │   ├── resume-versions/    # 简历版本模块
│   │   ├── ai/                 # AI 模块
│   │   ├── publish/            # 发布模块
│   │   └── pdf/                # PDF 模块
│   ├── common/                 # 公共模块
│   │   ├── decorators/
│   │   ├── filters/
│   │   ├── interceptors/
│   │   ├── pipes/
│   │   └── exceptions/
│   ├── config/                 # 配置
│   └── prisma/                 # Prisma 服务
├── test/
├── nest-cli.json
├── tsconfig.json
└── package.json
```

### 4.1 模块职责

| 模块 | 职责 |
|------|------|
| auth | 注册、登录、JWT 管理 |
| users | 用户信息 CRUD |
| profiles | 主档案及子模块管理 |
| job-targets | 岗位输入、解析调度 |
| resume-versions | 简历版本管理 |
| ai | AI 调用封装 |
| publish | 发布管理 |
| pdf | PDF 生成 |

## 5. 共享包 (packages/shared)

```
packages/shared/
├── src/
│   ├── types/                  # 共享类型
│   ├── constants/              # 常量
│   ├── utils/                  # 工具函数
│   └── index.ts
├── tsconfig.json
└── package.json
```

## 6. 数据库包 (packages/database)

```
packages/database/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seeds/
├── src/
│   └── index.ts
├── tsconfig.json
└── package.json
```

## 7. 配置文件

### 7.1 pnpm-workspace.yaml

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

### 7.2 根 package.json

```json
{
  "name": "ai-customize-resume",
  "private": true,
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "db:generate": "pnpm --filter @ai-resume/database prisma generate",
    "db:migrate": "pnpm --filter @ai-resume/database prisma migrate dev",
    "db:studio": "pnpm --filter @ai-resume/database prisma studio"
  },
  "devDependencies": {
    "turbo": "latest",
    "typescript": "^5.0.0"
  }
}
```

## 8. 涉及文件

| 文件/目录 | 说明 |
|-----------|------|
| `pnpm-workspace.yaml` | Workspace 定义 |
| `package.json` | 根配置 |
| `turbo.json` | 构建配置 |
| `apps/web/` | 前端应用 |
| `apps/api/` | 后端应用 |
| `packages/shared/` | 共享类型 |
| `packages/database/` | 数据库 |

## 9. 风险与注意事项

### 9.1 依赖管理

- 使用 `workspace:*` 引用内部包
- 注意版本一致性
- 避免循环依赖

### 9.2 构建顺序

1. `@ai-resume/database` (Prisma generate)
2. `@ai-resume/shared`
3. `@ai-resume/api`
4. `@ai-resume/web`

## 10. 后续计划

1. 初始化 pnpm workspace
2. 创建各应用和包的基础结构
3. 配置 TypeScript 和 ESLint
4. 完成 Prisma Schema 设计
