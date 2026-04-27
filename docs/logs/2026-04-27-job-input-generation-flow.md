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

## Verification Result

- Local Web TypeScript check passed.
- Server API build passed after `pnpm prisma generate`.
- Server Web production build passed.
- Server processes restarted and verified:
  - Web: `http://113.44.50.108:3000`
  - API: `http://113.44.50.108:3001`
- Smoke test completed:
  - Created test profile: `eb62915e-67ad-449b-a902-87a60808cfcd`
  - Created job target: `c7038d75-52ef-45ba-903d-f8a0997a2e11`
  - Reparsed job target with status `PARSE_SUCCESS`
  - Generated resume version: `57ad43aa-9335-4467-8f32-90775e9f9614`
  - Resume generation status: `READY_EDIT`
  - Published public token: `16a40df66622dedc17013bdfba455e30`
  - Public resume API returned HTTP `200`
- Confirmed pages respond:
  - `http://113.44.50.108:3000/jobs`
  - `http://113.44.50.108:3000/resumes`
  - `http://113.44.50.108:3000/r/16a40df66622dedc17013bdfba455e30`
- Confirmed server operation logs include:
  - `job_created`
  - `job_parsed`
  - `resume_created`
  - `resume_generated`
  - `resume_published`
  - `public_resume_viewed`

## Deployment Notes

- Code commit: `9e5e459 feat: add job input to resume generation flow`.
- Server log paths remain:
  - `/root/ai_customize_resume/apps/api/logs/app.log`
  - `/root/ai_customize_resume/apps/api/logs/operations.log`
  - `/root/ai_customize_resume/apps/api/logs/error.log`
