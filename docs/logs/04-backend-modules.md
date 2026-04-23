# 后端模块拆分

## 1. 目标

将后端业务拆分为清晰的模块，每个模块职责单一、依赖明确。

## 2. 模块总览

| 模块 | 职责 | 依赖 |
|------|------|------|
| Auth | 用户认证、JWT 管理 | Prisma, JwtModule |
| Users | 用户信息管理 | Prisma |
| Profiles | 主档案及经历管理 | Prisma |
| JobTargets | 岗位输入、解析调度 | Prisma, AI |
| ResumeVersions | 简历版本管理 | Prisma, AI |
| AI | AI 调用封装 | Prisma (日志) |
| Publish | 发布管理 | Prisma, PDF |
| PDF | PDF 生成 | - |

## 3. 模块依赖图

```
Auth ──────────► Users
                    │
                    ▼
Profiles ◄─────────┘
     │
     ├──► (子模块: Education, Work, Project, Skill, Certificate)
     │
     └──► ResumeVersions
              │
              ├──► JobTargets
              │        │
              │        └──► AI
              │
              └──► AI
                       │
                       └──► AITaskLog

ResumeVersions ───► Publish ───► PDF
```

## 4. 各模块详细设计

### 4.1 Auth 模块

**目录结构：**
```
auth/
├── auth.module.ts
├── auth.controller.ts
├── auth.service.ts
├── dto/
│   ├── register.dto.ts
│   ├── login.dto.ts
│   └── auth-response.dto.ts
├── strategies/
│   └── jwt.strategy.ts
└── guards/
    └── jwt-auth.guard.ts
```

**API 端点：**
| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| POST | /auth/register | 用户注册 | 否 |
| POST | /auth/login | 用户登录 | 否 |
| POST | /auth/logout | 用户登出 | 是 |
| GET | /auth/me | 获取当前用户 | 是 |

**核心逻辑：**
- 注册：邮箱查重 → 密码哈希 → 创建用户 → 返回 JWT
- 登录：验证邮箱密码 → 生成 JWT → 设置 HttpOnly Cookie
- 登出：清除 Cookie

### 4.2 Users 模块

**目录结构：**
```
users/
├── users.module.ts
├── users.controller.ts
├── users.service.ts
└── dto/
    ├── update-user.dto.ts
    └── user-response.dto.ts
```

**API 端点：**
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /users/me | 获取当前用户信息 |
| PATCH | /users/me | 更新当前用户信息 |

### 4.3 Profiles 模块

**目录结构：**
```
profiles/
├── profiles.module.ts
├── profiles.controller.ts
├── profiles.service.ts
├── dto/
│   ├── create-profile.dto.ts
│   ├── update-profile.dto.ts
│   └── profile-response.dto.ts
└── sub-controllers/
    ├── education.controller.ts
    ├── work.controller.ts
    ├── project.controller.ts
    ├── skill.controller.ts
    └── certificate.controller.ts
```

**API 端点：**
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /profiles | 获取用户所有档案 |
| POST | /profiles | 创建主档案 |
| GET | /profiles/:id | 获取档案详情（含所有经历） |
| PATCH | /profiles/:id | 更新档案基本信息 |
| DELETE | /profiles/:id | 删除档案 |
| GET | /profiles/:id/education | 获取教育经历列表 |
| POST | /profiles/:id/education | 添加教育经历 |
| PATCH | /profiles/:id/education/:eduId | 更新教育经历 |
| DELETE | /profiles/:id/education/:eduId | 删除教育经历 |
| ... | ... | work/project/skill/certificate 类似 |

### 4.4 JobTargets 模块

**目录结构：**
```
job-targets/
├── job-targets.module.ts
├── job-targets.controller.ts
├── job-targets.service.ts
└── dto/
    ├── create-job-target.dto.ts
    ├── update-job-target.dto.ts
    ├── parse-job.dto.ts
    └── job-target-response.dto.ts
```

**API 端点：**
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /job-targets | 获取用户所有岗位 |
| POST | /job-targets | 创建岗位（输入链接或 JD 文本） |
| GET | /job-targets/:id | 获取岗位详情 |
| POST | /job-targets/:id/parse | 触发 AI 解析 |
| PATCH | /job-targets/:id/parsed | 用户修正解析结果 |
| DELETE | /job-targets/:id | 删除岗位 |

**核心流程：**
1. 用户输入链接或 JD 文本
2. 如有链接，尝试抓取页面内容
3. 调用 AI 解析 JD
4. 返回解析结果供用户确认
5. 用户可修正后保存

### 4.5 ResumeVersions 模块

**目录结构：**
```
resume-versions/
├── resume-versions.module.ts
├── resume-versions.controller.ts
├── resume-versions.service.ts
└── dto/
    ├── create-resume-version.dto.ts
    ├── update-resume-version.dto.ts
    ├── generate-resume.dto.ts
    └── resume-version-response.dto.ts
```

**API 端点：**
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /resume-versions | 获取用户所有版本 |
| POST | /resume-versions | 创建新版本（触发 AI 生成） |
| GET | /resume-versions/:id | 获取版本详情 |
| PATCH | /resume-versions/:id | 更新版本内容（手动编辑） |
| POST | /resume-versions/:id/copy | 复制为新草稿 |
| POST | /resume-versions/:id/regenerate | 重新生成 |
| POST | /resume-versions/:id/publish | 发布版本 |
| DELETE | /resume-versions/:id | 删除版本 |

**核心流程：**
1. 用户选择主档案和目标岗位
2. 调用 AI 生成定制简历
3. AI 校验结果一致性
4. 保存为草稿状态
5. 用户可在线编辑
6. 发布生成公开链接

### 4.6 AI 模块（核心）

**目录结构：**
```
ai/
├── ai.module.ts
├── ai.service.ts
├── providers/
│   ├── ai.provider.interface.ts
│   └── openai.provider.ts
├── prompts/
│   ├── parse-job.prompt.ts
│   ├── build-job-profile.prompt.ts
│   ├── generate-resume.prompt.ts
│   └── validate-resume.prompt.ts
├── schemas/
│   ├── parse-job.schema.ts
│   ├── job-profile.schema.ts
│   ├── generate-resume.schema.ts
│   └── validate-resume.schema.ts
├── mappers/
│   └── ai-result.mapper.ts
└── utils/
    ├── json-repair.ts
    ├── schema-validate.ts
    └── consistency-check.ts
```

**核心方法：**
```typescript
class AiService {
  // 解析岗位 JD
  async parseJobDescription(input: { jdText: string }): Promise<ParsedJob>
  
  // 构建岗位画像
  async buildJobProfile(input: { parsedJob: ParsedJob; jdText: string }): Promise<JobProfile>
  
  // 生成定制简历
  async generateTailoredResume(input: {
    profile: ResumeProfile;
    jobTarget: JobTarget;
    jobProfile: JobProfile;
  }): Promise<GeneratedResume>
  
  // 校验生成结果
  async validateGeneratedResume(input: {
    sourceProfile: ResumeProfile;
    generatedResume: GeneratedResume;
    jobTarget: JobTarget;
  }): Promise<ValidationResult>
}
```

### 4.7 Publish 模块

**目录结构：**
```
publish/
├── publish.module.ts
├── publish.controller.ts
├── publish.service.ts
└── dto/
    ├── publish-resume.dto.ts
    └── public-resume-response.dto.ts
```

**API 端点：**
| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| GET | /public/r/:token | 公开访问简历 | 否 |
| GET | /public/r/:token/pdf | 下载 PDF | 否 |

**核心逻辑：**
- 发布：生成随机 token → 创建发布记录 → 触发 PDF 生成
- 访问：验证 token → 返回简历内容 → 记录访问次数

### 4.8 PDF 模块

**目录结构：**
```
pdf/
├── pdf.module.ts
├── pdf.service.ts
└── templates/
    └── resume-template.html
```

**核心逻辑：**
- 使用 Playwright 渲染 HTML 模板
- 生成 A4 格式 PDF
- 保存到本地存储（预留 S3 扩展）

## 5. 公共模块

```
common/
├── decorators/
│   ├── current-user.decorator.ts    # 获取当前用户
│   └── public.decorator.ts          # 标记公开接口
├── filters/
│   └── http-exception.filter.ts     # 全局异常处理
├── interceptors/
│   └── transform.interceptor.ts     # 响应格式化
├── pipes/
│   └── validation.pipe.ts           # 参数校验
└── exceptions/
    └── business.exception.ts        # 业务异常
```

## 6. 涉及文件

| 目录 | 文件数 | 说明 |
|------|--------|------|
| auth/ | 6 | 认证模块 |
| users/ | 4 | 用户模块 |
| profiles/ | 8+ | 主档案模块 |
| job-targets/ | 5 | 岗位模块 |
| resume-versions/ | 5 | 简历版本模块 |
| ai/ | 15+ | AI 模块 |
| publish/ | 4 | 发布模块 |
| pdf/ | 3 | PDF 模块 |
| common/ | 6 | 公共模块 |

## 7. 风险与注意事项

### 7.1 循环依赖

- AI 模块不依赖业务模块
- 业务模块通过事件或直接调用 AI Service

### 7.2 事务处理

- 涉及多表操作时需要事务
- Prisma 支持交互式事务

### 7.3 并发控制

- 简历生成时防止重复请求
- 使用 Redis 锁或状态检查

## 8. 后续计划

1. 创建各模块基础结构
2. 实现 Auth 模块
3. 实现 Profiles 模块
4. 实现 AI 模块核心
5. 实现 ResumeVersions 模块
6. 实现 Publish 和 PDF 模块
