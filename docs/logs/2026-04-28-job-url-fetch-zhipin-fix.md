# 2026-04-28 职位网址抓取修复记录

## 问题描述

用户反馈输入 BOSS 直聘网址后，系统会把“BOSS直聘 加载中，请稍候”或通用搜索/登录页当作岗位内容，导致岗位名称、职责和要求解析错误。

## 问题原因

1. 原逻辑只把网页正文转文本，没有充分过滤加载页、安全校验页和搜索导航页。
2. BOSS 直聘搜索页在服务器环境经常不返回具体职位卡片，而是返回“登录查看全部职位/没有更多职位”的通用页面。
3. 原 Puppeteer 逻辑只尝试读取搜索结果卡片，没有尝试进入职位详情链接。
4. 当无法获取具体 JD 时，系统没有生成可编辑的降级岗位目标，导致无效页面文本进入 AI 解析。

## 解决方案

1. 重写 `JobsService` 的 URL 抓取流程。
2. 对 BOSS 直聘详情页优先提取 `.job-title`、`.salary`、`.job-sec`、`.job-detail`、`.company-info` 等结构化内容。
3. 对 BOSS 搜索页尝试寻找并进入 `/job_detail/` 链接。
4. 如果搜索页被限制，只基于 URL 中的 `query` 和 `city` 生成可编辑岗位目标，不再把加载页/导航页当作 JD。
5. 增加抓取日志：`job_url_fetched`、`job_url_rendered`、`job_url_detail_link_found`、`job_url_fallback_built`。
6. 修正 AI fallback 对 `岗位名称：xxx` 的标题提取。

## 修改文件

- `apps/api/src/modules/jobs/jobs.service.ts`
- `apps/api/src/modules/ai/ai.service.ts`

## 验证结果

- 后端构建通过：`apps/api/node_modules/.bin/nest.cmd build`
- 服务器环境验证 BOSS 搜索页会返回通用登录/搜索页面；修复后会进入降级分支，生成可编辑岗位目标，不再解析“加载中”文本。
