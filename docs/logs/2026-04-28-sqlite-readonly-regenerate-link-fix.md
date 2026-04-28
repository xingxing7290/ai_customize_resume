# 2026-04-28 SQLite Readonly Fix for Regenerating Public Links

## Symptom
- Regenerating a public resume link failed in `resumePublishRecord.update`.
- SQLite returned `attempt to write a readonly database`.

## Cause
- The database file itself was writable by root, but the API process was still holding a stale SQLite connection after deployment restored/replaced `apps/api/prisma/dev.db`.
- SQLite can report a readonly database when the active process has an invalid/stale database handle after file replacement.

## Server Actions
- Verified file write access with `fs.openSync('prisma/dev.db', 'r+')`.
- Ensured writable permissions:
  - `chmod 775 apps/api/prisma`
  - `chmod 664 apps/api/prisma/dev.db`
- Restarted the API process on port `3001`.

## Verification
- Created a smoke-test user, profile, resume, and publish record.
- Called `POST /publish/:versionId/regenerate`.
- The regenerated token was returned successfully and differed from the original token.

## Notes
- Future deployments that restore or replace the SQLite file should restart the API process after the database file is restored.
