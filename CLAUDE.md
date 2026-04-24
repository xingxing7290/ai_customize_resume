# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI 简历定制平台 - 智能生成针对特定岗位的定制简历。Monorepo 结构，使用 Turborepo + pnpm workspace。

## Development Commands

```bash
# Install dependencies
pnpm install

# Start all services (frontend + backend)
pnpm dev

# Build all
pnpm build

# Run tests
pnpm test

# Lint
pnpm lint

# Database operations (Prisma)
cd apps/api
npx prisma generate      # Generate Prisma client
npx prisma migrate dev   # Run migrations
npx prisma studio        # Open Prisma Studio

# Individual app commands
pnpm --filter @ai-resume/api dev    # Backend only
pnpm --filter web dev              # Frontend only
```

## Architecture

### Monorepo Structure
- `apps/web` - Next.js 16 frontend (React 19, Tailwind CSS 4)
- `apps/api` - NestJS backend (TypeScript)
- `packages/` - Shared packages (unused currently)
- `docs/logs/` - Development logs

### Backend (apps/api)
- **Database**: SQLite + Prisma ORM (schema at `apps/api/prisma/schema.prisma`)
- **Auth**: JWT + Passport, bcrypt for passwords
- **Modules**: auth, profiles, jobs, resumes, publish, pdf, ai
- **API Docs**: Swagger at `/api/docs`

Key models: User, ResumeProfile, EducationRecord, WorkExperience, ProjectExperience, SkillRecord, CertificateRecord, JobTarget, ResumeVersion, ResumePublishRecord, AITaskLog

### Frontend (apps/web)
- **Route groups**: `(auth)` for login/register, `(dashboard)` for main app
- **API client**: `src/lib/api.ts` - centralized fetch wrapper with token handling
- **Styling**: Tailwind CSS 4 with custom CSS variables in `globals.css`

### Data Flow
1. User creates ResumeProfile with education/work/project/skill/certificate records
2. User adds JobTarget (parsed from JD URL or text)
3. AI generates tailored ResumeVersion from profile + job target
4. ResumeVersion can be published (creates ResumePublishRecord with public token)
5. PDF generated from ResumeVersion data

## Deployment

Cloud server at `113.44.50.108`:
- Frontend: http://113.44.50.108:3000
- Backend: http://113.44.50.108:3001

SSH connection: `ssh -i ~/.ssh/ai_resume_server root@113.44.50.108`

## Important Notes

- SQLite stores JSON arrays as strings - use `JSON.stringify()` when saving, `JSON.parse()` when reading
- Next.js 16 uses Turbopack in dev mode
- All API responses follow `{ code, message, data, timestamp }` format
- Token stored in localStorage as `accessToken`