# 2026-04-28 Dashboard Language Runtime

## Context
- User reported that after selecting English on login, authenticated feature pages still showed Chinese.
- The dashboard contains many existing pages and some older mojibake text, so a page-by-page static rewrite would be fragile and slow to maintain.

## Changes
- Added `DashboardLanguageRuntime`, mounted from the authenticated dashboard layout.
- The runtime reads the existing `useLanguage()` state and translates dashboard static UI text nodes when English is selected.
- It also handles placeholders, titles, aria labels, mutation updates, and confirm dialogs.
- Added mappings for normal Chinese UI labels and common historical mojibake strings across profiles, jobs, resumes, and resume editing pages.

## Verification Plan
- Build web on the server Node 20 runtime.
- Open login, select English, enter dashboard pages, and confirm major UI labels render in English.

## Notes
- User-entered resume/JD data is not intentionally translated at the source level.
- This runtime keeps future dashboard pages closer to language-aware behavior without duplicating translation code in each page.
