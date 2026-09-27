# Current requested update — acceptance checklist

This checklist is not a completion claim. Production must be verified after migrations and deployment.

- [x] Worship dropdown styling uses the shared rounded emerald/dark-mode native controls; keyboard behavior remains native. Browser viewport verification still requires an available signed-in session.
- [ ] Fasting preferences: Monday/Thursday, calculated Hijri white days, or both. Only scheduled days affect scoring. Explicit completion separate from choosing fasting type.
  - Schedule/score helpers and preference UI are published; SQL columns were applied. An authenticated manual save is the remaining runtime check.
- [ ] Quran tracked in quarter-juz units; user-configurable target and promotion duration (default one month), explicit approval.
  - Quarter input, duration preference, configured progression and approval target update are published. Settings changes reset stage start and preserve historical targets/schedules using settings_history; regression tests pass.
- [ ] Qiyam predefined user target, score against it, progression synchronized to settings.
  - Target setting, scoring, and opt-in progression are published; historical scoring regression tests pass.
- [ ] Correct streak, quantitative progression, editable counters and functional notification delivery/preferences.
  - Streak/quantitative scoring and editable counters are covered by tests. Push API, category preferences, symbolic time resolution, idempotent dispatch, and cleanup are implemented; actual browser permission/device delivery remains an environment-dependent manual check.
- [x] Vault filter toolbar: high-contrast responsive toolbar with wrapping filters and dark-mode styles is published.
- [ ] Courses and books: real learning/reading progress tracking, not just saved links.
  - VaultLearning includes plans, daily target, sessions/notes/undo, named lessons, course filter/discovery, and three component tests; migration 202609270014 is applied.
- [x] Home: daily shortcuts, task/worship/learning progress cards, and navigation to daily surfaces are published.
- [x] Regression/unit tests (36 passing), strict typecheck, and production build pass.
- [x] Apply additive Supabase migrations 202609270013, 202609270014, and 202609270015; SQL Editor verification returned all four columns. Account save/isolation still needs an authenticated manual CRUD check.
- [x] Push commit 59ab111 and verify the public domain returns the current app shell and latest worship markers; the deployment dashboard may briefly show Building while Vercel finishes.
- [ ] Verify the changed worship/vault/home journeys at desktop and mobile widths. Existing Playwright 3/3 only verifies the public login screen widths, API JSON separation, and empty guest worship setup. It does not prove the populated dashboards, tracking controls, authenticated CRUD, or Push delivery work end-to-end.

Preserve existing records and the user's untracked design document. No destructive seed/reset operations.
