# 2026-04-29 PDF 中文字体方框修复

## 问题描述

用户反馈 PDF 导出后中文全部显示为方框。

## 问题原因

服务器字体库中只有 DejaVu 和 Liberation 字体，没有中文 CJK 字体。Puppeteer/Chromium 在生成 PDF 时无法找到中文字形，因此中文字符被渲染为方框。

## 解决方案

1. 在云服务器安装 Noto CJK 字体：
   - `fonts-noto-cjk`
   - `fonts-noto-cjk-extra`
2. 执行 `fc-cache -fv` 刷新字体缓存。
3. 验证 `fc-match 'Noto Sans CJK SC'` 可匹配到 `NotoSansCJK-Regular.ttc`。
4. 将 PDF CSS 字体栈调整为优先使用 `Noto Sans CJK SC`。

## 修改文件

- `apps/api/src/modules/pdf/pdf.service.ts`

## 验证结果

- 服务器已能识别中文字体。
- 后续 PDF 生成会使用 Noto CJK 字体渲染中文。
