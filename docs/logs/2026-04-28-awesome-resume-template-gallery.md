# 2026-04-28 Awesome Resume Template Gallery

## Context
- User requested integrating resume style ideas from https://github.com/dyweb/awesome-resume-for-chinese.
- The current template files had partial template expansion plus several garbled Chinese strings that broke JSX/TS strings.

## Changes
- Added a 12-template gallery based on common Chinese resume directions:
  - Modern Chinese resume
  - LaTeX ModernCV
  - Compact one-page resume
  - Deedy two-column resume
  - Orbit sidebar resume
  - Markdown resume
  - Academic Chinese CV
  - billryan-style elegant resume
  - Typst clean resume
  - ATS black-and-white resume
  - Business executive resume
  - Creative purple resume
- Rebuilt the template picker as visual thumbnail cards so style differences are visible before selection.
- Updated private resume edit preview, public resume page preview, and PDF export to share the same template ids.
- Added legacy style aliases so older links such as `style=sidebar`, `style=mono`, or `style=minimal` still resolve to a supported style.

## Verification
- API build passed locally after Prisma client generation.
- Web local build remains blocked by local Node 18.20.1; Next.js 16 requires Node >=20.9.
- Web production build should be verified on the server Node 20 runtime during deployment.

## Files
- `apps/web/src/components/resume/ResumePreview.tsx`
- `apps/web/src/components/resume/TemplateSelector.tsx`
- `apps/web/src/app/(dashboard)/resumes/[id]/page.tsx`
- `apps/web/src/app/r/[token]/page.tsx`
- `apps/api/src/modules/pdf/pdf.service.ts`
