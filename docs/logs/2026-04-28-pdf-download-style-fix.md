# 2026-04-28 PDF 下载与样式一致性修复

## 问题描述

用户反馈简历样式基本可用后，PDF 下载再次出现问题，并要求打印 PDF 时必须与当前选中的样式一致。

## 排查过程

1. 查看服务器 API 日志，当前没有新的 PDF 生成异常。
2. 使用服务器上的公开简历 token 验证 PDF 下载接口。
3. 批量测试 10 个模板：Azurill、Bronzor、Chikorita、Ditto、Gengar、Onyx、Pikachu、Rhyhorn、Ditgar、Meowth。
4. 所有公开 PDF 接口均返回 `200`，且生成有效 PDF 文件。

## 解决方案

1. PDF 生成阶段设置 A4 viewport，并启用 `preferCSSPageSize`，确保 CSS 中的 A4 页面尺寸优先。
2. 等待字体加载完成后再输出 PDF，降低中文字体或布局未稳定时导出的风险。
3. 增加 `print-color-adjust: exact`，保证颜色、侧栏和背景块按选中样式输出。
4. PDF 接口失败时写入服务器文件日志，并返回明确 JSON 错误。
5. 下载文件名包含当前样式，便于确认下载的 PDF 使用了哪个模板。
6. 前端下载时校验响应 `Content-Type` 和文件大小，避免把错误响应当作 PDF 下载。
7. 公开简历页面打印时隐藏顶部下载工具条。

## 修改文件

- `apps/api/src/modules/pdf/pdf.service.ts`
- `apps/api/src/modules/pdf/pdf.controller.ts`
- `apps/web/src/app/(dashboard)/resumes/[id]/page.tsx`
- `apps/web/src/app/r/[token]/page.tsx`

## 验证结果

- 后端构建通过：`apps/api/node_modules/.bin/nest.cmd build`
- 前端类型检查通过：`apps/web/node_modules/.bin/tsc.cmd --noEmit`
- 服务器批量验证所有公开模板 PDF 均返回 `200` 并生成有效 PDF。
