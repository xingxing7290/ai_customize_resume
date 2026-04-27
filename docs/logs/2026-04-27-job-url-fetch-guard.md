# 2026-04-27 Job URL Fetch Guard

## Goal

- Prevent dynamic recruiting pages, such as BOSS Zhipin loading/security-check pages, from being parsed as real JD content.
- Keep URL input useful while making the fallback clear: if the site blocks readable content, the user must paste the full JD text and reparse.

## Problem

- Some job boards render the real job text in the browser after JavaScript/security checks.
- Server-side fetch can receive placeholder text such as loading or security-check content.
- The previous flow treated that placeholder as JD text, so the parser produced a fake job named after the loading page.

## Changes

- Added backend JD validation before parsing.
- Skip parsing and mark the job as `PARSE_FAILED` when fetched content is:
  - Empty
  - Too short
  - A loading page
  - A security-check/captcha/login placeholder
- Reparse now clears previously misparsed fields when validation fails.
- Added operation log event `job_parse_skipped` with the reason.

## Verification Plan

- Build API and Web on the server.
- Test the reported BOSS Zhipin URL.
- Confirm the job is not parsed as a real job and the log records `job_parse_skipped`.
- Confirm normal pasted JD text still parses and generates resumes.

## Verification Result

- Local Web TypeScript check passed.
- Server API build passed after `pnpm prisma generate`.
- Server Web build passed.
- Server API restarted and listened on `3001`; Web remained available on `3000`.
- Tested the reported BOSS Zhipin URL:
  - Job id: `1cae1140-e3ce-46c5-929d-7e1fc780f9c4`
  - Status: `PARSE_FAILED`
  - Parsed title: `null`
  - Raw fetched text started with `BOSS直聘 加载中，请稍候`
  - Error: `Fetched content is too short to parse as a job description. Paste the full JD text and reparse.`
- Tested a manually pasted embedded engineer JD:
  - Job id: `02a2bc49-a0d8-4af5-a551-a7c0f261e6e8`
  - Status: `PARSE_SUCCESS`
- Confirmed the new behavior prevents loading/security pages from being used as real JD content.

## Deployment Notes

- GitHub commit: `8227a20 fix: guard job parsing against loading pages`.
- Server `git pull` over HTTPS failed twice with `GnuTLS recv error (-110)`.
- To avoid delaying the production fix, changed files were copied to the server over SSH and built there.
- Server should be able to reconcile with GitHub later by retrying `git pull origin main` when the HTTPS connection is stable.
