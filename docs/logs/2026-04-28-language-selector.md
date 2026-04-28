# 2026-04-28 Language Selector

## Context
- User requested an English language selection entry for the system, placed appropriately on the home/login page.

## Changes
- Added a reusable language preference hook backed by `localStorage`.
- Added a `LanguageSelector` component with `中文 / EN` options.
- Placed the selector at the top-right of the login and register pages.
- Connected the same language preference to the authenticated dashboard navigation.
- Cleaned the auth page copy while adding English translations for login and registration flows.

## Verification
- Local web build was blocked by machine disk space (`ENOSPC`) before compilation.
- Final verification should be performed on the server Node 20 environment.
