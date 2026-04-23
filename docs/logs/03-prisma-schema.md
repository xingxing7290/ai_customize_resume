# Prisma Schema 设计

## 1. 目标

设计完整的数据库模型，支撑 AI 岗位定制简历平台的所有业务需求。

## 2. 数据库选型

- **数据库**: PostgreSQL 15.x+
- **ORM**: Prisma 5.x
- **原因**: JSONB 支持、全文搜索、类型安全、迁移管理

## 3. 枚举定义

### 3.1 JobTargetStatus (岗位状态)

| 值 | 说明 |
|----|------|
| INIT | 初始化 |
| FETCHING | 正在抓取 |
| FETCH_SUCCESS | 抓取成功 |
| FETCH_FAILED | 抓取失败 |
| PARSING | 正在解析 |
| PARSE_SUCCESS | 解析成功 |
| PARSE_FAILED | 解析失败 |

### 3.2 ResumeVersionStatus (简历版本状态)

| 值 | 说明 |
|----|------|
| DRAFT | 草稿 |
| GENERATING | 生成中 |
| GENERATE_FAILED | 生成失败 |
| READY_EDIT | 可编辑 |
| PUBLISHED | 已发布 |
| ARCHIVED | 已归档 |

### 3.3 AITaskType (AI 任务类型)

| 值 | 说明 |
|----|------|
| PARSE_JOB | 解析岗位 |
| BUILD_JOB_PROFILE | 构建岗位画像 |
| GENERATE_RESUME | 生成简历 |
| VALIDATE_RESUME | 校验简历 |

### 3.4 AITaskStatus (AI 任务状态)

| 值 | 说明 |
|----|------|
| PENDING | 待处理 |
| PROCESSING | 处理中 |
| SUCCESS | 成功 |
| FAILED | 失败 |
| RETRIED | 已重试 |

## 4. 核心实体关系

```
User (1) ──────► (N) ResumeProfile
User (1) ──────► (N) JobTarget
User (1) ──────► (N) ResumeVersion
User (1) ──────► (N) AITaskLog

ResumeProfile (1) ──────► (N) EducationRecord
ResumeProfile (1) ──────► (N) WorkExperience
ResumeProfile (1) ──────► (N) ProjectExperience
ResumeProfile (1) ──────► (N) SkillRecord
ResumeProfile (1) ──────► (N) CertificateRecord
ResumeProfile (1) ──────► (N) ResumeVersion

JobTarget (1) ──────► (N) ResumeVersion

ResumeVersion (1) ──────► (N) ResumePublishRecord
ResumeVersion (1) ──────► (N) ResumeVersion (复制关系)
```

## 5. 表设计说明

### 5.1 users (用户表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 主键 (cuid) |
| email | String | 邮箱 (唯一) |
| password_hash | String | 密码哈希 |
| name | String? | 姓名 |
| avatar | String? | 头像 |
| is_active | Boolean | 是否激活 |

### 5.2 resume_profiles (主档案表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 主键 |
| user_id | String | 用户 ID (外键) |
| name | String | 姓名 |
| email | String | 邮箱 |
| phone | String? | 电话 |
| location | String? | 所在地 |
| website | String? | 个人网站 |
| github | String? | GitHub |
| linkedin | String? | LinkedIn |
| summary | Text? | 个人简介 |
| self_evaluation | Text? | 自我评价 |
| is_default | Boolean | 是否默认档案 |

### 5.3 job_targets (目标岗位表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 主键 |
| user_id | String | 用户 ID |
| source_url | String? | 招聘链接 |
| raw_jd_text | Text? | 原始 JD 文本 |
| fetched_text | Text? | 抓取的文本 |
| status | Enum | 状态 |
| parsed_* | - | 解析结果字段 |
| profile_* | - | 岗位画像字段 |

### 5.4 resume_versions (简历版本表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 主键 |
| user_id | String | 用户 ID |
| profile_id | String | 主档案 ID |
| job_target_id | String? | 岗位 ID |
| source_version_id | String? | 复制来源 |
| name | String | 版本名称 |
| status | Enum | 状态 |
| content_* | - | 简历内容字段 |
| ai_* | - | AI 生成信息 |

### 5.5 ai_task_logs (AI 任务日志表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 主键 |
| user_id | String | 用户 ID |
| task_type | Enum | 任务类型 |
| status | Enum | 状态 |
| request_payload | Json | 请求内容 |
| response_payload | Json? | 响应内容 |
| error_message | Text? | 错误信息 |
| retry_count | Int | 重试次数 |
| duration_ms | Int? | 耗时 |
| token_used | Int? | Token 消耗 |

## 6. 索引设计

| 表 | 索引字段 | 说明 |
|----|----------|------|
| resume_profiles | user_id | 按用户查询 |
| education_records | profile_id | 按档案查询 |
| work_experiences | profile_id | 按档案查询 |
| project_experiences | profile_id | 按档案查询 |
| skill_records | profile_id | 按档案查询 |
| certificate_records | profile_id | 按档案查询 |
| job_targets | user_id, status | 按用户和状态查询 |
| resume_versions | user_id, profile_id, status | 多维度查询 |
| resume_publish_records | public_token | 公开访问 |
| ai_task_logs | user_id, task_type, status | 日志查询 |

## 7. 涉及文件

| 文件 | 说明 |
|------|------|
| `packages/database/prisma/schema.prisma` | Schema 定义 |
| `packages/database/prisma/migrations/` | 迁移文件 |
| `packages/database/src/index.ts` | 导出 Prisma Client |

## 8. 风险与注意事项

### 8.1 JSON 字段

- `content_work_experiences`、`content_project_experiences` 使用 Json[] 存储
- 需要在应用层做类型校验
- 查询时注意 JSON 操作性能

### 8.2 级联删除

- User 删除时级联删除所有关联数据
- ResumeProfile 删除时级联删除所有经历记录
- JobTarget 删除时 ResumeVersion 的 job_target_id 设为 NULL

### 8.3 状态流转

- JobTarget 状态只能单向流转
- ResumeVersion 状态有明确流转规则
- 状态变更需要记录日志

## 9. 后续计划

1. 执行 `prisma migrate dev` 生成迁移
2. 创建种子数据
3. 在后端集成 Prisma Service
