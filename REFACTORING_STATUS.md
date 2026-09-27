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
