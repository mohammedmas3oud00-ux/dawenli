# Feature Architecture Migration

## Current responsibility map

`src/components/hierarchical/HierarchicalApp.tsx` now primarily composes the presentation shell, persistence boundary, feature hooks, and remaining cross-feature flows:

| Responsibility | Current location | Target boundary |
|---|---|---|
| Authentication session and sign-out | `features/auth/providers/AuthProvider.tsx` plus app callbacks | `features/auth` |
| Repository selection, initial load, snapshot persistence | `app/store/useAppDataPersistence.ts` | `app/providers` or a data-sync service |
| Hierarchy CRUD and progress recalculation | `HierarchicalApp.tsx`, `utils/hierarchicalStore.ts` | `features/dashboard` / `features/tasks` |
| Task status and creation helpers | `features/tasks/utils/taskActions.ts` | `features/tasks` |
| Habit mutations and streak calculation | `HierarchicalApp.tsx`, `utils/habitStreak.ts` | `features/habits` |
| Ibadat setup, logs, progression, prayer scheduling | `HierarchicalApp.tsx`, `utils/ibadat.ts` | `features/ibadat` |
| AI credential and voice capture flow | `HierarchicalApp.tsx`, `utils/aiCredentials.ts` | `features/ai` |
| Browser/push notifications and toasts | `HierarchicalApp.tsx`, `utils/pushNotifications.ts` | `features/notifications` and shared UI |
| Navigation and drill-down selection | `HierarchicalApp.tsx` | `app/router` or a dashboard navigation hook |
| Rendering | `HierarchicalApp.tsx` and lazy feature views | `features/*/components` |

## Dependency map

```text
App
└── AppShell
    └── AuthProvider
        └── AppRouter
            └── HierarchicalApp
                ├── useAuth -> authService -> shared Supabase client
                ├── useAppDataPersistence -> repositoryFactory -> DataRepository
                │   ├── GuestLocalRepository -> localStorage
                │   └── SupabaseRepository -> Supabase RPC/tables
                ├── appStore (Zustand, current cross-feature store)
                ├── taskActions / hierarchicalStore (pure business rules)
                └── lazy feature components
```

The main coupling is the snapshot boundary: feature handlers mutate arrays in the global store, then the persistence effect saves the entire snapshot. This is intentionally retained as a compatibility seam while CRUD repositories are introduced incrementally.

## This increment

Before:

```text
HierarchicalApp
├── creates the repository
├── loads and applies the snapshot
├── debounces and queues every save
├── owns repository refs and readiness state
└── renders the application and owns feature handlers
```

After:

```text
HierarchicalApp
├── useAuth
├── useAppDataPersistence
│   ├── selects the repository for the current user
│   ├── loads and applies normalized data
│   ├── owns debounced queued persistence
│   └── exposes saveSnapshot/applySnapshot for explicit flows
└── renders the application and owns feature handlers
```

`useAppDataPersistence` is an application-level migration seam, not a new domain abstraction. It keeps the existing database schema and snapshot queue unchanged while removing authentication/data synchronization details from the component. It also clears the repository when the user signs out, preventing writes to the previous account. Snapshot queue generations invalidate pending writes during account changes, and reset operations are serialized through the same queue so a delayed save cannot resurrect cleared data.

## Existing feature infrastructure

The repository now contains feature stores and store-backed hooks for `auth`, `tasks`, `habits`, `ibadat`, `inbox`, and `vaults`, plus lifecycle hooks for `ai` and `notifications`. Task and habit services expose CRUD-compatible operations over the current snapshot repository seam; converting the Supabase implementation to row-level CRUD remains a separate database-risk decision.

## Migration sequence

1. **Completed groundwork:** isolate Supabase access, add `DataRepository`, repository factory, auth provider, Zustand app store, lazy feature views, and feature service/hook foundations.
2. **Current increment:** extract app-level load/save synchronization into `useAppDataPersistence`, add GitHub CI, move task/habit/inbox/vault/Ibadat collections into feature stores, add CRUD-compatible feature hooks/services, extract dashboard navigation into `useDashboardNavigation`, route AI credential plus push notification actions through feature hooks, extract review mutations into `useReviews`, and move hierarchy/focus/time-block CRUD into `useHierarchyCrud`.
3. **Follow-up:** replace the snapshot-backed service implementations with row-level Supabase CRUD only after schema/RLS contract tests are available.
4. Move remaining Ibadat setup/progression and inbox/vault conversion handlers into feature services without changing component props.
5. Continue extracting presentation groups from `HierarchicalApp` into feature components; the current shell is 1,541 lines and no longer owns the migrated CRUD handlers.
6. Keep the snapshot adapter until all collections have migrated, then remove legacy snapshot-only paths in a separate release.

## Verification

The current increment passed:

- `npm run typecheck`
- `npm test -- --run` (62 tests)
- `npm run build`
- `git diff --check`

The production build still reports the pre-existing large main chunk warning; it is a performance follow-up, not a correctness failure.

## Vercel and GitHub delivery

`.github/workflows/ci.yml` runs on pull requests and pushes to `main`. It installs with `npm ci`, then runs typechecking, the complete Vitest suite, and the production web build. Vercel remains responsible for Preview Deployments on pull requests and the production deployment from `main`.

Configure the following Vercel variables separately for Preview and Production; never commit their values:

```env
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
GEMINI_API_KEY
```

Use a non-production Supabase project for Preview when tests or manual verification mutate data. The browser must only receive the Supabase anon key; a service-role key belongs only in protected server-side environment variables.
