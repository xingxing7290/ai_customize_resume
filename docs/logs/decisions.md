# Technical Decisions

## Decision 001: 采用 NestJS + Next.js 分离架构

### 背景
需要选择前后端架构方案，有两种选择：
1. Next.js 全栈（API Routes）
2. NestJS (后端) + Next.js (前端) 分离

### 备选方案
- 方案 A: Next.js API Routes
- 方案 B: NestJS + Next.js 分离

### 最终决定
采用方案 B：NestJS + Next.js 分离架构

### 原因
1. 业务复杂度较高，AI 调用链路复杂
2. NestJS 模块化、依赖注入更完善
3. 装饰器丰富，验证、文档自动生成
4. 便于后续扩展微服务
5. 测试支持更完善

### 影响
- 需要维护两个应用
- 需要处理跨域配置
- 部署时需要两个服务

---

## Decision 002: 采用 JWT + HttpOnly Cookie 鉴权

### 背景
需要选择鉴权方案，有两种选择：
1. Bearer Token (localStorage)
2. HttpOnly Cookie

### 备选方案
- 方案 A: Bearer Token
- 方案 B: HttpOnly Cookie

### 最终决定
采用方案 B：JWT + HttpOnly Cookie

### 原因
1. HttpOnly Cookie 天然防 XSS
2. Web 端为主，安全性优先
3. CSRF 可通过 SameSite 配置防护
4. 无需前端手动管理 Token

### 影响
- 需要配置 CORS credentials
- 需要配置 CSRF 防护
- 移动端需要额外处理

---

## Decision 003: AI 输出结构化 JSON 而非 HTML

### 背景
AI 生成的简历内容需要选择存储格式：
1. 直接生成 HTML
2. 生成结构化 JSON

### 备选方案
- 方案 A: AI 直接输出 HTML
- 方案 B: AI 输出结构化 JSON

### 最终决定
采用方案 B：AI 输出结构化 JSON

### 原因
1. JSON 可直接编辑，HTML 解析困难
2. JSON 可做 Schema 校验和事实核查
3. JSON 易于版本管理和 diff
4. JSON 可适配多模板、多语言
5. 数据与展示分离

### 影响
- 需要定义完整的 Schema
- 需要前端模板渲染
- 需要做一致性校验

---

## Decision 004: 采用三段式 AI 流程

### 背景
AI 生成简历的流程设计：
1. 一次性生成
2. 分阶段处理

### 备选方案
- 方案 A: 一次性生成
- 方案 B: JD 解析 → 简历生成 → 结果校验

### 最终决定
采用方案 B：三段式流程

### 原因
1. 每阶段职责单一，便于调试
2. 解析结果可人工确认
3. 校验阶段可防止虚构
4. 失败时可针对性重试
5. 日志更清晰

### 影响
- 流程更复杂
- 需要多次 AI 调用
- 但可控性更强

---

## Decision 005: 采用 Prisma ORM

### 背景
需要选择 ORM 方案：
1. TypeORM
2. Prisma
3. 原生 SQL

### 备选方案
- 方案 A: TypeORM
- 方案 B: Prisma
- 方案 C: 原生 SQL

### 最终决定
采用方案 B：Prisma

### 原因
1. 类型安全，自动生成类型
2. 迁移管理方便
3. 关系映射清晰
4. 开发体验好
5. 文档完善

### 影响
- 需要学习 Prisma Schema 语法
- 复杂查询可能需要原生 SQL
