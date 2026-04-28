# 2026-04-28 Reactive Resume 样式重构记录

## 问题描述

用户反馈当前简历样式仍然不像参考项目，需要完整参考 `amruthpillai/reactive-resume` 的模板体系，并让网页预览、公开链接和 PDF 下载使用同一套选中样式。

## 参考分析

- Reactive Resume 的模板不是简单换色，而是每个模板都有独立结构。
- 主要模板包括 Azurill、Bronzor、Chikorita、Ditto、Gengar、Onyx、Pikachu、Rhyhorn、Ditgar、Meowth 等。
- 典型结构：
  - Azurill：居中页眉、侧栏资料、主栏时间线。
  - Bronzor：五栏网格，每个区块左侧标题、右侧内容。
  - Chikorita：右侧强调色栏。
  - Ditto：顶部大色块页眉。
  - Gengar / Ditgar：左侧深色或强调色栏，主栏承载经历。
  - Onyx / Meowth：更克制的单栏、ATS/中文正式投递友好。

## 解决方案

1. 将前端模板 ID 统一为 Reactive Resume 风格模板名。
2. 保留旧模板 ID 映射，旧公开链接中的 `modern`、`ats`、`orbit` 等仍可自动转换。
3. 重写 `ResumePreview`，为不同模板提供真实结构差异，而不是只换颜色。
4. 重写 `TemplateSelector`，缩略图直接展示每种模板的布局特征。
5. 重写后端 PDF HTML/CSS，确保 PDF 下载与页面预览的选中样式一致。
6. 将默认模板从 `modern` 调整为 `azurill`。

## 修改文件

- `apps/web/src/components/resume/ResumePreview.tsx`
- `apps/web/src/components/resume/TemplateSelector.tsx`
- `apps/web/src/app/(dashboard)/resumes/[id]/page.tsx`
- `apps/api/src/modules/pdf/pdf.service.ts`

## 验证结果

- 后端：`apps/api/node_modules/.bin/nest.cmd build` 通过。
- 前端类型检查：`apps/web/node_modules/.bin/tsc.cmd --noEmit` 通过。
- 前端本地完整构建未运行成功，原因是本机 Node.js 为 18.20.1，而 Next.js 16 要求 Node.js >= 20.9.0；后续在云服务器 Node 20 环境构建验证。
