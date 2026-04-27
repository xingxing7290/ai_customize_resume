# 2026-04-27 Browser Render Job URL Fetch

## Goal

- Improve direct job URL parsing for dynamic recruiting pages.
- Add a browser-render fallback after normal HTTP fetch.

## Changes

- `JobsService.resolveJdText` now runs in two stages:
  - Stage 1: normal server-side HTTP fetch and HTML-to-text extraction.
  - Stage 2: if fetched text is not valid JD content, launch Puppeteer/Chromium, render the page, wait for body text, and extract rendered text.
- Added operation log events:
  - `job_url_fetch_unusable`
  - `job_url_rendered`
  - `job_url_render_failed`
- Browser launch uses server-safe Chromium flags:
  - `--no-sandbox`
  - `--disable-setuid-sandbox`
  - `--disable-dev-shm-usage`

## Limits

- If a recruiting site requires login, captcha, or security verification, browser rendering can still return a blocked page.
- In that case the job remains `PARSE_FAILED`, and the user must paste the real JD text or a future cookie/browser-extension workflow must be added.

## Verification Plan

- Build API and Web.
- Test BOSS Zhipin URL after browser render fallback.
- Confirm operation logs show whether browser rendering succeeded or failed.
- Confirm pasted JD still parses successfully.

## Runtime Finding

- The first server test triggered browser-render fallback, but Chromium failed to start because the server lacked native browser libraries.
- Observed missing dependency:
  - `libatk-1.0.so.0`
- The operation log also exposed that payload fields named `message` could overwrite the operation action name.

## Follow-up Changes

- Updated the file logger so operation action names are not overwritten by payload fields.
- Updated browser render failure payload to use `errorMessage`.
- Server needs Chromium native dependencies installed before Puppeteer can render dynamic job pages.
