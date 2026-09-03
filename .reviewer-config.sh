# .reviewer-config.sh — claude-code-reviewer configuration
# Source: https://github.com/jazzsequence/claude-code-reviewer
#
# Sourced by .githooks/pre-commit. Keep it at the project root.
# Committed rather than gitignored: these are project standards, and the gate's
# thresholds should be reviewable like any other rule. Contains no secrets.

# ── Test commands ─────────────────────────────────────────────────────────────
# Leave a variable empty ("") to skip that check entirely.

REVIEWER_TEST_CMD="npm test -- --run --reporter=dot"
REVIEWER_LINT_CMD="npm run lint"
REVIEWER_BUILD_CMD="npm run build"

# E2E is enabled here, unlike the upstream default. This project is a Next.js
# frontend against a live WordPress backend, and E2E is the only layer that
# catches routing conflicts and runtime errors the unit suite cannot see.
REVIEWER_E2E_CMD="npm run test:e2e"

# ── Commit size limits (AI commits only) ──────────────────────────────────────
REVIEWER_MAX_FILES=5          # max changed files (add/modify/delete, excluding lock files)
REVIEWER_MAX_RENAMES=20       # max renamed files (renames are lower-risk than edits)
REVIEWER_MAX_INSERTIONS=500   # max lines inserted

# ── Approval settings ─────────────────────────────────────────────────────────
REVIEWER_APPROVAL_TIMEOUT=300              # seconds before approval expires
REVIEWER_APPROVAL_FILE="reviewer-approved" # filename; kept at project root

# ── File filtering ────────────────────────────────────────────────────────────
# Files matching this pattern skip the test suite. Deliberately a blocklist by
# extension rather than a path allowlist: anything that is not plainly text runs
# the full suite, so a new file type is safe by default rather than exempt.
REVIEWER_TEXT_ONLY_PATTERN='\.(md|txt)$'

# Excluded from the commit size count. Lockfile diffs are enormous on any
# dependency change and carry no reviewable intent.
REVIEWER_EXCLUDED_FILES='^package-lock\.json$|^yarn\.lock$|^pnpm-lock\.yaml$'
