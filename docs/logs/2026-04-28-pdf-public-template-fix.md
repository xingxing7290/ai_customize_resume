# 2026-04-28 PDF, Public Link, and Template Fix

## Context
- User reported PDF download failure and inaccessible generated public links.
- User requested multiple resume styles, with both public URL rendering and PDF export using the selected style.
- Reference direction reviewed:
  - https://github.com/whidy/resume for resume-as-web/PDF output direction.
  - https://github.com/amruthpillai/reactive-resume for template-oriented resume rendering direction.

## Root Causes
- Private PDF download opened `/pdf/:id` in a new tab, so the browser did not send the JWT `Authorization` header.
- Backend PDF endpoints returned HTML print pages instead of a real `application/pdf` file.
- The public page and PDF endpoint did not share a style/template parameter.

## Changes
- Backend PDF generation now uses Puppeteer to render HTML and return a binary PDF.
- Added `style=modern|classic|compact` support for private and public PDF endpoints.
- Added server operation logs for private and public PDF downloads.
- Added a shared React `ResumePreview` renderer with three templates: modern, classic, compact.
- Resume edit page now has a style selector, authenticated PDF download via `fetch`, and published links include the selected style.
- Public resume page now reads the style from the URL and downloads the PDF using the same selected style.

## Verification Plan
- API build after `prisma generate`.
- Web production build on the server Node 20 environment.
- Smoke test authenticated PDF download, public resume JSON, public page HTTP status, and public PDF content type.

## Notes
- Local machine has Node 18.20.1; Next.js 16 requires Node >=20.9, so web production build must be verified on the server.
- `AGENTS.md` has an unrelated title-only local modification and was intentionally not included in this change.
