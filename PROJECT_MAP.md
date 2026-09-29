# PROJECT MAP

## Runtime architecture

- `src/main.tsx` mounts the React application and registers `public/sw.js` in production.
- `src/App.tsx` composes `AuthProvider`, `AppShell`, and `AppRouter`.
- `src/components/hierarchical/HierarchicalApp.tsx` is the current UI composition root. It contains user-owned uncommitted navigation changes that must be preserved.
- `src/app/store/useAppDataPersistence.ts` loads and persists complete `AppDataSnapshot` values through `src/data/repository.ts`.
- `server.ts` is the Express API implementation used by local/standalone deployment and imported by Vercel entrypoints under `api/`.
- `supabase/migrations/` is the canonical database schema history. Existing migrations are immutable; fixes are added as later idempotent migrations. `supabase/config.toml` runs the stack locally through Docker; `202610020001_supabase_integrity_and_snapshot_cas.sql` provides CAS and ownership hardening; the `2026100300*` migrations enable push extensions and keep database lint clean.

## Data boundaries

- Authentication: `src/features/auth/**`, `src/utils/supabaseClient.ts`, and the authentication middleware in `server.ts`.
- Snapshot persistence: `src/data/repository.ts`, `src/shared/services/snapshotPersistence.ts`, and `public.dawenli_save_snapshot`.
- Push: `src/utils/pushNotifications.ts`, `/api/push/*` in `server.ts`, `api/push/*`, `public/sw.js`, and push-related Supabase migrations.
- Google Calendar: UI handlers in `src/components/hierarchical/HierarchicalApp.tsx`, API routes in `server.ts`, and Google tables in Supabase migrations.
- AI: client helpers under `src/features/ai/**` and `src/utils/`, protected routes in `server.ts`, and encrypted credential RPCs.

## P0 affected files

- `server.ts`: validate push endpoints/timezones, bind and consume OAuth state, protect dispatch isolation, and use shared Vercel behavior.
- `api/push/dispatch.ts`, `api/push/subscription.ts`, `api/push/public-key.ts`: delegate to the canonical Express implementation.
- A new Supabase migration: revoke unsafe helper RPC execution, add server-only OAuth/sync state, repair ownership constraints, and introduce snapshot revision support.
- API and security contract tests under `src/` and Supabase tests. `npm run test:supabase:security:local` executes the plain SQL suites locally; `npm run test:supabase` additionally verifies Auth, cross-user RLS isolation, anonymous RPC denial, CAS conflicts, and snapshot round trips.
- `src/shared/services/pushSecurity.ts` centralizes endpoint, key, and timezone validation; Vercel push entrypoints delegate to `server.ts`.

## P1 affected files

- `src/data/repository.ts` and persistence tests: snapshot revision/conflict handling.
- `src/features/dashboard/hooks/useHierarchyCrud.ts` plus the UI composition root: relationship-safe deletes.
- `server.ts`: locked/idempotent Google synchronization and strict DB error propagation.
- Focus, Inbox, Calendar, Prayer, Ibadat, and audio capture components with focused regression tests. Focus completion, Inbox parent guards, and calendar reminder parsing now have isolated tests.

## P2 affected files

- Feature/app stores and persistence boundaries only where duplicate state is production-reachable.
- `package.json`, `eslint.config.js`, Prettier metadata, Vitest coverage configuration, and Node/Playwright tooling.
- Unit/integration tests for security contracts, persistence conflicts, cascade behavior, and async cleanup.

## P3 affected files

- `.github/workflows/ci.yml`, `playwright.config.ts`, TypeScript test configuration, and Node version metadata.
- `public/sw.js`, `public/manifest.webmanifest`, `vercel.json`, `.env.example`, and `README.md`.

## Compatibility assumptions

- Existing API response envelopes and Arabic user-facing messages remain compatible unless a security rejection is required.
- Existing migrations are not rewritten.
- Guest-local persistence remains available.
- Vercel functions may import the Express app, matching the existing AI and Google catch-all pattern.
- User changes in `.gitignore` and `src/components/hierarchical/HierarchicalApp.tsx` are preserved and only the minimum required lines in the latter may be edited.

## Known deprecated or transitional areas

- Feature component files currently re-export legacy hierarchical components.
- Several feature hooks are not production consumers yet.
- `appStore` still contains duplicate collection fields during the incremental store migration.
- These areas are changed only when required to eliminate an active correctness risk; broad migration is deferred to avoid unrelated refactoring.

## Local quality gates (verified)

- `npm run typecheck` (tsc --noEmit): clean.
- `npm run lint` (ESLint flat config): clean.
- `npm run test`: 61 files / 242 tests passing.
- `npm run test:coverage`: 30.75% statements, 25.81% branches, 31.99% lines (target was 30%).
- `npm run build`: 1892 modules transformed successfully.
- Supabase SQL suites (`npm run test:supabase`, `npm run test:supabase:security:local`, `npx supabase db lint`) were validated earlier in this session and remain green; they require the local Docker stack, which is not running in the current environment.
- All work is committed locally on `codex/feature-based-architecture` with no push performed.

## Test coverage map

- Persistence: `src/data/repository.test.ts` (16), `src/shared/services/snapshotPersistence.test.ts` (4), `src/app/store/useAppDataPersistence.test.ts` (6), `src/data/legacyMigration.test.ts` (7).
- Hooks: `useRepositoryQuery`, `useTasks`, `useHabits`, `useInbox`, `useVaults`, `useIbadat`, `useReviews`, `useAI`, `useNotifications`, `useDashboardNavigation`, `useAuth`.
- Services: tasks, habits, inbox, vaults, ibadat, auth, AI, notification adapters with load/save error mapping.
- Utilities: `reviewEngine` diagnostics/health/audit, `taskRecommender`, `speechRecognition`, `pushNotifications`, `audioChime`, `habitStreak`, `date`, `id`, `worshipLayout`, `worshipReminderTime`, `hierarchicalStore`, `reminder`.
- UI: `ProgressBar`, `Breadcrumbs`, focus session logic, inbox conversion guards, prayer times refresh.
- Auth: `AuthProvider` lifecycle (init, failure recovery, state changes, guest adopt, sign out) and `useAuth` boundary guard.
