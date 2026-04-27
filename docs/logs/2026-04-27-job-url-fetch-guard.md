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

