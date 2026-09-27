# Feature-based refactor status

## Baseline

`HierarchicalApp.tsx` currently coordinates authentication, repository selection, snapshot persistence, global entity state, navigation, modals, hierarchy handlers, worship, AI, and notifications. Existing feature components are already lazy-loaded, but their state and handlers are still owned by the coordinator.

## Dependency map

- `HierarchicalApp` -> `DataRepository` -> `GuestLocalRepository` / `SupabaseRepository`.
- Authentication state selects the repository and controls loading/saving.
- Snapshot state feeds every feature component and the atomic Supabase RPC.
- Hierarchy updates recalculate progress before the snapshot save.
- Worship, AI, and Push have feature-specific utilities but share coordinator state and toasts.
- Navigation and modal state are cross-feature concerns and will move last.

## Phase 1 delivered on this branch

- Added shared service error shape with `code`, `message`, and `requestId`.
- Added a shared Supabase import boundary.
- Added auth, tasks, habits, ibadat, AI, and notification service adapters.
- Adapters preserve the existing repository and snapshot contract; no schema or UI behavior changes are intended.

## Safety rule

The adapters are not wired into the coordinator until their contract tests pass. Snapshot persistence remains the source of truth during the migration.

## Phase 2/3 delivered

- `AuthProvider` and `useAuth` now own Supabase session observation and sign-out.
- `HierarchicalApp` consumes the auth boundary while retaining its existing UI and repository-selection behavior.
- Shared entity state now lives in `useAppStore` (Zustand); existing handlers keep their setter-compatible API during migration.
- `snapshotFromState` provides one typed projection for future persistence extraction.
- The old atomic snapshot queue remains active; no data migration or schema change was made.

## Phase 4 started

- Added the `features/ibadat` component and calculation boundaries.
- The lazy-loaded production route now enters through the feature boundary while the legacy implementation remains available for rollback.
- Added repository-backed hooks for tasks, habits, ibadat, AI, and notifications with consistent loading/error/retry behavior.

## Phase 7 started

- Extracted `AppShell` and `AppRouter` from the root entry point.
- `App.tsx` now only composes the shell, providers, and route boundary.
- `HierarchicalApp` remains the compatibility route until individual feature screens are moved.

## Feature route boundaries

- Tasks, habits, vaults, inbox, and ibadat now load through `src/features/*/components` boundaries.
- Legacy components remain as implementation modules so the public props and visual behavior stay unchanged.
- Added repository adapters and hooks for vaults and inbox, completing the feature boundary set for the primary CRUD entities.
