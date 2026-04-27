# 2026-04-27 System Audit And Main Flow Repair

## 1. Goal
Check whether the AI resume platform can still run end to end, using `claude_code_prompt_ai_resume_platform_final.md` and `AGENTS.md` as the main functional references.

## 2. Current Findings
- Frontend is Next.js 16 and requires Node.js >=20.9.0; the local machine currently exposes Node.js 18.20.1.
- Local `pnpm` is unavailable and `corepack enable pnpm` is blocked by Windows permissions.
- Local Prisma Client generation is blocked by `spawn EPERM`, so backend TypeScript reports missing Prisma model delegates.
- Frontend TypeScript check passes after the current changes.
- The main product flow had implementation gaps: job creation did not parse JD text, resume creation did not generate tailored content, and OpenAI failures stopped the flow.

## 3. Changes Made
- Added fallback AI behavior in `apps/api/src/modules/ai/ai.service.ts` so job parsing and resume generation still work without an OpenAI key.
- Updated `apps/api/src/modules/jobs/jobs.service.ts` and `jobs.module.ts` so JD text is parsed during job creation.
- Updated `apps/api/src/modules/resumes/resumes.service.ts` so a resume linked to a job target generates content immediately.
- Fixed resume copy logic to avoid double-encoding JSON string fields.
- Updated `apps/web/src/lib/api.ts` to unwrap backend response envelopes and parse JSON array fields.
- Rebuilt login, resume list, and resume edit pages to support the complete workflow: login, create resume, generate, edit, copy, regenerate, publish, and open PDF.
- Added API package scripts for Prisma generation after dependency installation.
- Updated root package metadata with npm workspaces and corrected Prisma filter scripts.

## 4. Verification
- Passed: `node node_modules/typescript/bin/tsc --noEmit --pretty false` in `apps/web`.
- Blocked locally: `apps/api` TypeScript/build until Prisma Client is generated.
- Blocked locally: `apps/web` Next build because Node.js 18.20.1 is below the Next.js 16 requirement.
- Blocked in Codex sandbox: direct server deployment because the tool cannot read the user's SSH private key.

## 5. Deployment Plan
Run on the server where Node.js 20 is available:

```bash
cd /root/ai_customize_resume
git pull origin main
pnpm install
cd apps/api
pnpm prisma generate
pnpm build
cd ../web
pnpm build
```

Then restart API and web services.

## 6. Risks
- Public sub-resource profile controllers still need stricter ownership checks before production hardening.
- The fallback AI path is intentionally conservative and only reuses user-provided facts; real OpenAI quality still depends on `OPENAI_API_KEY`.
- Current database is SQLite even though older docs mention PostgreSQL.

## 7. Next Step
Run the server build and browser smoke test against `http://113.44.50.108:3000`.
