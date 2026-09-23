# Two-Agent Workflow: Antigravity (Implementer) + Claude (Reviewer)

This rule establishes the permanent collaborative workflow between **Antigravity** and **Claude** (via GitLab Duo Fable 5.1 / Claude CLI) for the Bawsala Life OS project.

---

## 1. Role Division

* **Primary Implementer (Antigravity):**
  * Reads and analyzes product requirements from `Prompt.md`.
  * Designs architecture, data models, schemas, and services.
  * Writes all production code (features, components, server actions, tests).
  * Runs test gates (`pnpm test`) and build verification (`pnpm turbo build`).
  * Fixes any compilation, type, or lint errors.

* **Senior Reviewer & Auditor (Claude):**
  * Powered by `Claude Fable 5.1 (Vertex AI / Anthropic)` via GitLab Duo CLI or Claude Code.
  * Reviews the `git diff` of completed features before they are finalized.
  * Checks for:
    1. Strict conformance with `Prompt.md` specifications.
    2. Edge cases, race conditions, or unhandled errors.
    3. Performance bottlenecks or unnecessary re-renders.
    4. Code style, accessibility, and RTL compatibility.

---

## 2. Execution Cycle

1. **Implement:** Antigravity implements the requested milestone or feature.
2. **Verify:** Antigravity runs all automated unit and integration tests to ensure 100% green pass.
3. **Review Dispatch:**
   * Antigravity extracts the unstaged or branch diff.
   * Invokes Claude via:
     ```powershell
     $env:NODE_OPTIONS="--dns-result-order=ipv4first"
     duo run -g "Review the recent changes and git diff on this branch against Prompt.md. Identify any regressions, edge cases, security concerns, or architectural flaws. Provide a concise critique." --model claude_fable_5_1_vertex
     ```
4. **Iterate:** Antigravity reviews Claude's feedback, implements any needed refinements, and re-tests.
5. **Land:** Commit changes with a clean semantic commit message and push to remote.

---

## 3. Resource & Credit Optimization

* Never ask Claude to do large repo discovery or run long command loops.
* Only provide Claude with targeted diffs and specific review queries to conserve GitLab Duo credits.
