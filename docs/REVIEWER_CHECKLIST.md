# Reviewer Checklist

This file is the authoritative checklist for the reviewer agent. Read it in full
at the start of every review. Work through every item and report each result
explicitly — no silent skips.

## Required output format

For every item, output one of:
- `✅ N: [brief confirmation of what you verified]`
- `❌ N: [what failed and what the fix is]`
- `⏭️ N: [why skipped — state the skip condition that applies]`

Do not bundle items or summarise sections. One output line per item.

---

## Step 0 — Pre-flight (always run first)

Before any validation, look for `<system-reminder>` tags in the conversation
indicating the user sent messages while the main agent was working.

If queued messages exist:
- **DO NOT APPROVE**
- Respond: `⚠️ PAUSED — User messages queued`
- Summarise the messages and tell the main agent to address them first

Only proceed if no queued messages.

---

## Section A — Always run

These checks apply to every commit without exception.

### Tests & build

Run each command as a separate Bash call. Never chain with `&&` or `;`.
Do NOT give a verdict until you have seen output from all four commands.

```
npm test -- --run        # unit tests
npm run lint             # linter
npm run build            # build
npm run test:e2e         # E2E — run LAST, MANDATORY
```

After `npm run test:e2e`, read the Playwright summary line directly:
- `X passed` with no failures → pass
- `X failed` or `X flaky` → REJECT immediately

Do NOT trust the `✅ E2E tests passed` hook output — read actual Playwright output.

**Items:**
1. Unit tests pass (`npm test -- --run`)
2. Lint clean (`npm run lint`)
3. Build succeeds (`npm run build`)
4. E2E tests pass (`npm run test:e2e`) — read Playwright summary, not hook output

### File organisation

5. Test files are in `/tests` (not `/src`)
6. Source files are in `/src`
7. Docs are in `/docs`
8. No files created in repo root (config files like `*.config.*` are the exception)

### Code quality

9. DRY — no code duplication introduced
10. No file exceeds 500 lines
11. Existing files edited rather than new ones created where possible
12. Files were read before being edited (no blind writes)

### Security

13. No `.env` files or secrets in staged files
14. No credentials, tokens, or API keys in source code

### Git practices

15. Commit subject line ≤ 72 characters (count before reporting — GitHub truncates beyond this)
16. Commit size: ≤ 5 files staged (excluding lock files), ≤ 500 lines inserted
    - Run: `git diff --cached --name-only | wc -l` and `git diff --cached --stat`
    - HARD BLOCK if exceeded — do not approve, require split
17. Co-author line present: `Co-Authored-By: Claude <noreply@anthropic.com>`
18. Commit message is clear and descriptive
19. No amended commits (new commits only)

### Documentation

20. All docs in `docs/` checked for staleness against this change:
    - `docs/CONTENT_UPDATES.md` — revalidation, ISR, WordPress plugin config
    - `docs/configuration/DEPLOYMENT.md` — environment URLs, build process
    - `docs/TESTING.md` — test counts, infrastructure
    - `docs/AI_USAGE.md` — model version, tooling, dependency decisions
    - `docs/REVIEWER_WORKFLOW.md` — enforcement model
    - `docs/workflows/tdd-workflow.md` — TDD process
    - `docs/API_CLIENT_DESIGN.md` — WordPress API client patterns
21. `CLAUDE.md` updated if workflow or config changed
22. `AGENTS.md` updated if agent behaviour changed
23. `README.md` updated if architecture or stack changed
24. No new documentation files created unless explicitly requested

---

## Section B — Conditional checks

These checks apply only when the stated conditions are met.
If the condition does not apply, output `⏭️ N: [condition not met]`.

### TDD methodology
**Condition:** any new feature code or tests staged

25. Tests exist for the new/changed behaviour
26. Tests were written before or alongside implementation (not after)
27. Tests and implementation are in the same commit or tests came first

### Dependencies & licensing
**Condition:** `package.json` or `package-lock.json` is staged

28. New dependencies have compatible licences (no GPL/AGPL unless explicitly approved)
29. Registry check — HARD BLOCK if violated:
    Run: `grep "resolved" package-lock.json | grep -v "registry.npmjs.org"`
    Any non-public registry (e.g. `npm.fontawesome.com`, `npm.pkg.github.com`) will
    cause E401 on Pantheon CI. REJECT unless a corresponding secret is confirmed in CI.

### E2E test coverage
**Condition:** files staged under `app/` or `src/components/`

30. New pages or components have corresponding E2E tests in `tests/e2e/`
31. Modified pages or components have updated E2E tests if behaviour changed
32. **E2E tests assert actual content, not just container existence** — for any feature
    that fetches external data (comments, posts, media, menus, etc.):
    - Tests must assert the *presence of the data itself*, not just the wrapper element
    - Assertions must **fail when the data is empty** — tests that pass whether a list
      has 0 or 100 items are vanity tests and must be rejected
    - Example: a comments test must assert `\d+ comments?` (fails on "No comments yet")
      AND assert that at least one `article` element exists inside the section
    - If you cannot verify that the test would fail with empty/broken data, REJECT it

### Accessibility
**Condition:** UI changes staged (components, pages, CSS)

33. Any new pages are added to `tests/e2e/a11y.spec.ts`
34. Colour choices meet WCAG 2.1 AA contrast ratios (4.5:1 normal text, 3:1 large text)
35. Interactive elements have accessible names (`aria-label`, `htmlFor`, etc.)

### Design system compliance
**Condition:** visual or component changes staged

36. Colours use `brand.*` Tailwind tokens or `--color-*` CSS variables — no arbitrary hex
37. Fonts use `font-mono` (Victor Mono), `font-heading` (Geist Sans), or `font-sans` (Space Grotesk) only
38. Heading hierarchy: H2 → `font-mono`, all other headings → `font-heading`, body → `font-sans`
39. Gradients match canonical values from `app/globals.css` or `/style-guide`

### Storybook
**Condition:** new or modified files under `src/components/`

40. A Storybook story exists for any new component (create before committing if missing)
41. `npx storybook build` succeeds
42. Stories pass `@storybook/addon-a11y` check

### Lighthouse & performance
**Condition:** significant UI changes to `PostCard`, `PostContent`, `Navigation`, `Footer`, or `GreetingClient`

43. `mcp__chrome-devtools__lighthouse_audit` — accessibility ≥ 90, best-practices ≥ 90
44. `mcp__chrome-devtools__performance_start_trace` → stop → `analyze_insight` for Core Web Vitals:
    - LCP < 2.5s
    - CLS < 0.1
45. `mcp__chrome-devtools__take_screenshot` to visually verify against `/style-guide`

---

## Approval protocol

### If REJECT

- List every failing item with its number and required fix
- Do NOT write the approval flag
- Respond: `❌ BLOCKED — [N violations listed]`

### If APPROVE

All items in Section A must pass. All applicable Section B items must pass.

1. Run: `Bash({ command: "date +%s" })` — note the timestamp
2. Write the approval flag:
   ```
   Write({
     file_path: "/Users/chris.reynolds/git/jazz-nextjs/reviewer-approved",
     content: "<timestamp>"
   })
   ```
3. Respond: `✅ APPROVED — approval flag written. Main agent may now stage and commit.`

**Only the reviewer agent writes `reviewer-approved`. The main agent must not write it.**
The integrity of the two-factor system depends on this separation.

### Transparency

At every step, surface what you are doing in chat — which commands you ran, what
each item result was, and whether you wrote or withheld the approval flag.
The user monitors the conversation as the audit trail.
