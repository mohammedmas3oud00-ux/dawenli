# Current requested update — acceptance checklist

This checklist is not a completion claim. Production must be verified after migrations and deployment.

- [ ] Worship dropdown styling consistent with the rest of the app; mobile/dark/keyboard checks.
- [ ] Fasting preferences: Monday/Thursday, calculated Hijri white days, or both. Only scheduled days affect scoring. Explicit completion separate from choosing fasting type.
  - Implemented core schedule/score helpers and preference UI locally; pending migration and end-to-end verification.
- [ ] Quran tracked in quarter-juz units; user-configurable target and promotion duration (default one month), explicit approval.
  - Local quarter input, duration preference, configured progression and approval target update implemented; UI/cloud tests pending. Settings changes reset stage start and preserve historical targets/schedules using settings_history; regression tests added. Migration 202609270015 is required before publishing.
- [ ] Qiyam predefined user target, score against it, progression synchronized to settings.
  - Target setting, scoring, and opt-in progression implemented locally; historical scoring regression tests pass. UI/cloud verification pending.
- [ ] Correct streak, quantitative progression, editable counters and functional notification delivery/preferences.
  - Removed premature promotion success toast; fasting promotion now adds white-day scheduling. Notification delivery/preferences still incomplete.
- [ ] Vault filter toolbar: readable, responsive, consistent dark mode.
- [ ] Courses and books: real learning/reading progress tracking, not just saved links.
  - Local VaultLearning component: plan, daily target, sessions/notes/undo, named lesson completion. Three component tests pass. Integrated into reading modal; courses currently started from resource items. Needs explicit course discovery/filter and published verification. Migration 202609270014 adds learning JSON.
- [ ] Home: daily shortcuts, clear progress and evaluations.
- [ ] Regression/unit/UI tests for the requested behaviors, typecheck and build.
- [x] Apply additive Supabase migrations 202609270013, 202609270014, and 202609270015; SQL Editor verification returned all four columns. Account save/isolation still needs an authenticated manual CRUD check.
- [x] Push commit 59ab111 and verify the public domain returns the current app shell and latest worship markers; the deployment dashboard may briefly show Building while Vercel finishes.
- [ ] Verify published user journeys at phone and desktop widths; do not infer success from build alone.

Preserve existing records and the user's untracked design document. No destructive seed/reset operations.
