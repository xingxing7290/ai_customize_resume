# 2026-04-27 Experience Entry And Operation Logging Fix

## Goal

- Fix education experience creation failures in the resume profile flow.
- Add visible entry points for education, work experience, project experience, skills, and certificates on the profile page.
- Add a backend file logging system so request, operation, and error logs are retained on the server for diagnosis.
- Preserve this maintenance operation in project logs.

## Findings

- The education/work/project sub pages used local API URL fallbacks that could make the production browser call `localhost:3001`.
- Work and project forms submitted array values for fields stored as text by the backend schema.
- The profile list did not expose clear work/project management entry points.
- Backend errors and key operations were not persisted to project log files.

## Changes

- Added backend file logger and request logging middleware.
- Persisted logs to:
  - `apps/api/logs/app.log`
  - `apps/api/logs/operations.log`
  - `apps/api/logs/error.log`
- Logged key operations for jobs, resumes, publishing, public resume views, HTTP errors, and API startup.
- Reworked profile list entry points for:
  - Education
  - Work experience
  - Project experience
  - Skills
  - Certificates
- Reworked education/work/project pages to use the central API client and backend-compatible payloads.

## Verification Plan

- Run local Web TypeScript check.
- Build API and Web on the server.
- Restart server processes.
- Verify server routes and smoke-test education/work/project creation through the API.
- Confirm server log files are created and receive entries.

## Verification Result

- Local Web TypeScript check passed.
- Server API build passed after `pnpm prisma generate`.
- Server Web production build passed.
- Server processes restarted and listened on:
  - Web: `http://113.44.50.108:3000`
  - API: `http://113.44.50.108:3001`
- Smoke test created a test user and profile, then created and read:
  - Education records: `1`
  - Work records: `1`
  - Project records: `1`
- Confirmed operation and error logs are written under `/root/ai_customize_resume/apps/api/logs`.

## Deployment Notes

- Commit deployed first: `3da66da fix: add operation logs and experience entry points`.
- During process restart, an old API process initially held port `3001`; this was captured in `error.log` as `EADDRINUSE`.
- The API and Web were then restarted with new processes and verified through HTTP.
