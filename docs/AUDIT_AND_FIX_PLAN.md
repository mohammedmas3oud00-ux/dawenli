# Bawsala Life OS — Comprehensive Architectural & Quality Audit

> **Document:** `docs/AUDIT_AND_FIX_PLAN.md`  
> **Auditor:** Principal Software Architect & Senior Code Auditor  
> **Date:** September 2026  
> **Scope:** Phases 1, 2, 2.5, and 3 (from initial architecture through Time Tracking & Second Brain)  
> **Baseline Requirements:** [`Prompt.md`](../Prompt.md) & [`PROJECT_MAP.md`](../PROJECT_MAP.md)

---

## 1. Executive Summary & Health Score

| Dimension | Score | Status | Summary |
|---|---|---|---|
| **Architecture & Modularity** | **94 / 100** | 🟢 Excellent | Clear separation between `@bawsala/core`, `@bawsala/db`, and `@bawsala/web`. Zero circular dependencies. |
| **Requirements Conformance** | **90 / 100** | 🟢 Excellent | Core vertical hierarchy (Vision → Goals → Projects → Tasks → Daily Actions → Habits → Reviews → Knowledge/Time) matches `Prompt.md`. |
| **Database & Schema Integrity** | **88 / 100** | 🟡 Strong (Needs Minor Hardening) | Full RLS coverage on 17 tables, soft-delete triggers, rollups. Minor policy tightening required on `note_tags`. |
| **Security & Authorization** | **90 / 100** | 🟢 Strong | All server actions enforce `requireUser()`. RLS enabled on all tables. |
| **Test Coverage & Verification** | **95 / 100** | 🟢 Excellent | 161/161 automated tests passing across 4 packages with PGlite integration tests. |
| **Overall Project Health** | **91 / 100** | 🟢 **Ready for Phase 4 (AI Integrations) after surgical fixes** |

---

## 2. Categorized Findings & Identified Issues

### 🚨 Critical / High Priority (Security & Data Consistency)

#### 1. `note_tags` RLS Policy Overly Permissive
* **File:** [`packages/db/src/schema/knowledge.ts`](file:///d:/0.Bawsala/packages/db/src/schema/knowledge.ts#L82) & [`packages/db/migrations/0002_time_and_knowledge.sql`](file:///d:/0.Bawsala/packages/db/migrations/0002_time_and_knowledge.sql#L97)
* **Issue:** The RLS policy for `note_tags` currently uses `USING (true) WITH CHECK (true)` for any authenticated user. Because `note_tags` is a junction table without a direct `user_id` column, an authenticated user could theoretically link their tag to someone else's note if IDs are known.
* **Impact:** Cross-tenant metadata linking vulnerability.
* **Prescribed Fix:** Enforce ownership via subquery on `notes`:
  ```sql
  CREATE POLICY "note_tags_owner_all" ON "note_tags" AS PERMISSIVE FOR ALL TO "authenticated"
  USING (EXISTS (SELECT 1 FROM notes WHERE notes.id = note_tags.note_id AND notes.user_id = (select auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM notes WHERE notes.id = note_tags.note_id AND notes.user_id = (select auth.uid())));
  ```

#### 2. `time_entries` Does Not Increment `tasks.actual_minutes`
* **File:** [`packages/db/src/services/time.service.ts`](file:///d:/0.Bawsala/packages/db/src/services/time.service.ts#L13)
* **Issue:** `Prompt.md` specifically requires tracking actual time spent on tasks and projects to compare against estimated time (`estimateMinutes` vs `actualMinutes`). Currently, logging a time entry creates a record in `time_entries`, but does not automatically accumulate into `tasks.actualMinutes`.
* **Impact:** `tasks.actualMinutes` remains null unless manually updated, breaking the time comparison metrics on the task card.
* **Prescribed Fix:** In `logTimeEntry`, if `input.taskId` is provided, execute an atomic SQL increment:
  ```typescript
  if (input.taskId) {
    await db.update(tasks)
      .set({ actualMinutes: sql`coalesce(${tasks.actualMinutes}, 0) + ${input.durationMinutes}` })
      .where(owned(tasks.userId, tasks.deletedAt, userId, tasks.id, input.taskId));
  }
  ```

---

### ⚠️ Medium Priority (UX, Edge Cases & Performance)

#### 3. Note Creation Does Not Associate Tags in UI
* **File:** [`apps/web/features/knowledge/actions.ts`](file:///d:/0.Bawsala/apps/web/features/knowledge/actions.ts#L13)
* **Issue:** `tags` and `note_tags` tables exist in the database, but the quick-create form in `knowledge/page.tsx` only accepts `title`, `category`, and `content`.
* **Impact:** Users cannot yet assign tags during note creation from the web UI.
* **Prescribed Fix:** Add an optional `tags` text input (comma-separated or picker) in `knowledge/page.tsx` and process it in `createNoteAction`.

#### 4. Audio Alert Autoplay on Focus Timer
* **File:** [`apps/web/features/focus/components/focus-timer.tsx`](file:///d:/0.Bawsala/apps/web/features/focus/components/focus-timer.tsx#L32)
* **Issue:** Browser autoplay policies frequently block `AudioContext` if it was not instantiated or resumed from a direct user interaction. While the code has a `try/catch`, initializing the `AudioContext` on the first click of "Start Focus" ensures the chime reliably sounds when the countdown finishes.
* **Prescribed Fix:** Pre-warm the `AudioContext` on `Play` button click.

#### 5. Soft-Delete Cascade for `time_entries` and `notes`
* **File:** [`packages/db/src/services/tasks.service.ts`](file:///d:/0.Bawsala/packages/db/src/services/tasks.service.ts)
* **Issue:** When a task is soft-deleted (`deletedAt = now()`), its related `time_entries` remain active with `deletedAt = null`. Queries for task time still filter by `taskId`, but soft-deleting a task could leave orphan entries in queries that join tasks.
* **Prescribed Fix:** Add soft-delete cascade trigger or query check for `isNull(tasks.deletedAt)`.

---

### 💡 Low Priority / Code Quality & Cleanups

#### 6. Temporary Test Scripts in Root
* **Files:** `scripts/check-duo.js`, `scripts/check-duo.ps1`, `scratch/`
* **Issue:** Leftover diagnostic scripts used for token introspection should either be formalized in `scripts/` or added to `.gitignore`.
* **Prescribed Fix:** Move to `.gitignore` or clean up.

---

## 3. Prioritized Surgical Remediation Plan

Execute the following fixes sequentially before commencing Phase 4:

1. **[FIX-1] Harden `note_tags` RLS Policy:**
   - Update `packages/db/src/schema/knowledge.ts` to check `notes.user_id = auth.uid()`.
   - Update `packages/db/migrations/0002_time_and_knowledge.sql`.
   - Verify with `pnpm --filter @bawsala/db test`.

2. **[FIX-2] Atomic Accumulation of Task `actualMinutes`:**
   - In `packages/db/src/services/time.service.ts`, increment `tasks.actualMinutes` whenever a session is logged for `taskId`.
   - Add assertion in `packages/db/tests/services.test.ts`.

3. **[FIX-3] Pre-warm AudioContext in Focus Timer:**
   - Update `apps/web/features/focus/components/focus-timer.tsx` to initialize audio upon starting the timer.

4. **[FIX-4] Verify All Quality Gates:**
   - Run `pnpm turbo test build` to ensure 100% green pass.
