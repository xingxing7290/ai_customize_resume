# 2026-04-27 Job Input And Resume Generation Flow

## Goal

- Make the product flow visible and usable from the UI:
  - Master profile
  - Job URL or JD input
  - Job parsing
  - Resume generation
  - Online editing
  - Publish public URL
  - Export PDF
- Add backend support for URL-only job input and manual reparse.
- Keep this development operation recorded for Git and deployment traceability.

## Findings

- The backend had `sourceUrl`, but `POST /jobs` only parsed `rawJdText`.
- The job detail page called `/jobs/:id/reparse`, but the API did not implement that endpoint.
- The resume generation page existed but did not present the required end-to-end flow clearly.
- Some production pages still used `localhost:3001` as fallback API URL.
- Several pages had garbled Chinese copy, making the flow hard to understand.

## Changes

- Added URL resolution in `JobsService`:
  - If JD text is provided, parse that text.
  - If only URL is provided, try to fetch and strip page text.
  - If URL fetch fails, keep a clear fallback message in `rawJdText` so the user can paste JD and reparse.
- Added `POST /jobs/:id/reparse`.
- Rebuilt the job input list page with visible steps and fields for URL/JD.
- Rebuilt the job detail page with:
  - Editable JD text
  - Reparse action
  - Parsed responsibilities, requirements, and tech keywords
  - Profile selection and direct resume generation
- Rebuilt the resume version page with the complete generation flow.
- Rebuilt the resume editing page with save, regenerate, copy, publish, and PDF actions.
- Updated dashboard navigation labels.
- Replaced remaining production fallback API URLs that pointed to `localhost:3001`.

## Verification Plan

- Run local Web TypeScript check.
- Build API and Web on the server.
- Restart API and Web.
- Smoke-test:
  - Register/login
  - Create profile
  - Create job from JD text
  - Reparse job
  - Generate resume from job detail
  - Publish resume
  - Confirm operation logs are written

