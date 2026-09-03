# Reviewer Workflow Setup - Step-by-Step Guide

This document provides complete step-by-step instructions to reproduce the reviewer approval workflow in any project.

## What You Need (Prerequisites)

**Required:**
- [Claude Code CLI](https://github.com/anthropics/claude-code) installed
- Git repository

**NOT Required:**
- Claude Flow is **NOT** required for the reviewer workflow
- MCP servers are **NOT** required
- No external dependencies beyond Claude Code

## Architecture Overview

The reviewer workflow nominally has three layers, but **only one is reliably enforced** —
see "Layer 2" in `@docs/REVIEWER_WORKFLOW.md`, which owns the authoritative description:

1. **PreToolUse Hook** (Layer 1) - Blocks git commit before it starts
2. **Pre-commit Hook** (Layer 2) - **the layer that actually gates**; tracked in git and runs the full suite
3. **Behavioral Instructions** (Layer 3) - AI spawns reviewer proactively

See @docs/REVIEWER_WORKFLOW.md for the authoritative description of what each layer enforces.

```
User Request
    ↓
Main Agent writes code
    ↓
Main Agent spawns Reviewer Agent ← Uses Claude Code's Agent tool
    ↓
Reviewer runs tests/lint/checks
    ↓
Reviewer returns APPROVE/REJECT
    ↓
Reviewer Agent writes approval flag ← Uses Write tool (never the main agent)
    ↓
git commit triggers PreToolUse hook (Layer 1)
    ↓
Hook validates approval (blocks if missing/expired)
    ↓
git commit triggers pre-commit hook (Layer 2)
    ↓
Hook re-validates and deletes flag
    ↓
Commit allowed/blocked
```

## Step-by-Step Setup

### Step 1: Install the Pre-Commit Hook

The hook lives in the repo at **`.githooks/pre-commit`**. Install it with:

```bash
./.githooks/install.sh
```

That copies it to `.git/hooks/pre-commit` and marks it executable. The copy is a
snapshot — if you edit `.githooks/pre-commit`, re-run `install.sh` or the installed hook
silently diverges.

Re-running is safe. `install.sh` records what it installed in `.reviewer-manifest`, so it
can tell an installed copy that is unchanged since install from one edited by hand. The
first kind is updated; the second is preserved with a diff and needs `--force`, which
backs it up to `.git/hooks/pre-commit.bak` first. A first run on a project that predates
the manifest needs no flags — the existing hook is backed up and replaced.

`./.githooks/install.sh --check` reports the status without changing anything.

Behaviour comes from `.reviewer-config.sh` at the project root: which test, lint, build
and E2E commands run, the commit-size limits, the approval timeout, and which files are
treated as text-only or excluded from size counts. The hook ships defaults for all of
them, so a project without that file still works — but its defaults skip E2E.

Read `.githooks/pre-commit` for what it enforces; do not rely on a copy in this document.
Earlier revisions inlined a template here that drifted badly out of date (wrong approval
path, missing the commit-size gate, missing the test suite entirely). Its five checks are
summarised in `@docs/REVIEWER_WORKFLOW.md`.


### Step 2: Configure Claude Code Permissions

Create or edit `.claude/settings.json`:

```json
{
  "permissions": {
    "allow": [
      "Bash(git commit*)",
      "Bash(git add*)",
      "Bash(date*)",
      "Edit(*)",
      "Write(*)",
      "Agent(subagent_type=reviewer)"
    ]
  },
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "node .claude/helpers/hook-handler.cjs pre-bash",
            "timeout": 5000
          }
        ]
      }
    ]
  }
}
```

**Critical permissions explained:**

- `"Write(*)"` - **REQUIRED** - lets the *reviewer* agent write the approval flag without a prompt. The main agent shares this permission but must never use it to write `reviewer-approved`.
  - We use `"Write(*)"`; narrower globs were not made to work. The flag lives at the project root as `reviewer-approved`, not under `.git/hooks/`.
  - Must be exactly `"Write(*)"`
- `"Bash(date*)"` - For getting Unix timestamp
- `"Agent(subagent_type=reviewer)"` - Auto-approve spawning reviewer agents

**PreToolUse Hook Configuration:**
- Intercepts all `Bash` tool calls before execution
- Runs `.claude/helpers/hook-handler.cjs` to validate git commits
- Blocks commits without reviewer approval (Layer 1 enforcement)

**Note:** `.claude/settings.json` is **project-specific** and **gitignored** by default. Each developer needs to create this file locally.

### Step 2b: PreToolUse Hook Handler

The handler lives at **`.claude/helpers/hook-handler.cjs`** and is registered in
`.claude/settings.json`:

```json
"PreToolUse": [{
  "matcher": "Bash",
  "hooks": [{
    "type": "command",
    "command": "test -f .claude/helpers/hook-handler.cjs && node .claude/helpers/hook-handler.cjs pre-bash"
  }]
}]
```

**Do not append `|| true`.** It forces exit 0, and a `PreToolUse` hook only blocks a tool
call on **exit code 2** — every other code is a non-blocking error that lets the call
proceed. The handler exits 2 on its block paths for the same reason.

Read the handler for its behaviour rather than a copy here.

> **Neither of these two files is in this repository.** `.claude/` is gitignored
> (`.gitignore:45`), and `./.githooks/install.sh` installs *only* the pre-commit hook —
> it does not create `.claude/settings.json` or `hook-handler.cjs`. They come from the
> upstream installer at
> [`jazzsequence/claude-code-reviewer`](https://github.com/jazzsequence/claude-code-reviewer).
>
> **A fresh clone of this repo therefore has Layer 2 only, with no warning.** Run
> upstream's `install.sh` to get Layer 1.
>
> Note also that upstream's handler used `process.exit(1)` on its block paths until
> [PR #5](https://github.com/jazzsequence/claude-code-reviewer/pull/5) — so an install
> made before that merges gets a Layer 1 that prints `[BLOCKED]` and allows the commit.
> Check for `exit(2)` in your installed copy before assuming it enforces.


### Step 3: Create Project Requirements Document

Create `AGENTS.md` or add to `CLAUDE.md`:

```markdown
## Pre-Commit Reviewer Workflow

**REQUIRED before EVERY commit of AI-generated code:**

1. Spawn reviewer agent using Claude Code's Agent tool
2. Get APPROVE decision from agent
3. Reviewer agent writes the approval flag
4. Commit within 5 minutes

### Reviewer Agent Prompt Template

Use this prompt when spawning the reviewer:

\`\`\`
Review my uncommitted changes for compliance with project standards.

Check all requirements:

TDD METHODOLOGY:
1. Tests written BEFORE implementation?
2. All tests pass?
3. Lint clean?
4. Build successful?

FILE ORGANIZATION:
5. Files in correct directories?
6. No files in wrong locations?

DOCUMENTATION:
7. Relevant docs updated?
8. No unnecessary docs created?

CODE QUALITY:
9. DRY principle followed?
10. Files under line limit?

SECURITY:
11. No secrets committed?
12. No credentials in code?

GIT PRACTICES:
13. Incremental commits?
14. Clear commit messages?

If APPROVE: Say "APPROVED - I will create the approval flag"
If REJECT: List violations and fixes needed
\`\`\`

### User Bypass for Manual Commits

For your own manual changes (not AI-generated):

\`\`\`bash
USER_COMMIT=1 git commit -m "Your commit message"
\`\`\`
```

### Step 4: Test the Setup

**Test 1: Verify hook blocks commits without approval**

```bash
# Make a trivial change
echo "# test" >> README.md
git add README.md

# Try to commit (should be BLOCKED)
git commit -m "test"
# Expected: ❌ BLOCKED: No reviewer agent approval found
```

**Test 2: Verify user bypass works**

```bash
# Commit with bypass (should work)
USER_COMMIT=1 git commit -m "test"
# Expected: ✅ COMMIT ALLOWED

# Clean up
git reset HEAD~1
git checkout README.md
```

**Test 3: Verify reviewer workflow**

Ask Claude Code:
```
Make a small change to a file, spawn a reviewer agent to approve it, then commit the change.
```

Expected flow:
1. Claude makes change
2. Claude spawns reviewer agent
3. Reviewer returns "APPROVED - I will create the approval flag"
4. The reviewer agent writes `reviewer-approved` (project root) with a timestamp and a fingerprint of the staged index, so the approval cannot authorise a different set of changes
5. Claude runs `git add` and `git commit`
6. Pre-commit hook validates flag and allows commit

### Step 5: Document in README (Optional)

Add to your project's README:

```markdown
## Development Workflow

This project uses an AI-assisted development workflow with mandatory code review.

### For AI-Generated Code
1. Request changes from Claude Code
2. Claude spawns a reviewer agent automatically
3. Reviewer validates all requirements
4. Commit only proceeds with approval

### For Manual Changes
Use the bypass flag for your own edits:
\`\`\`bash
USER_COMMIT=1 git commit -m "Your message"
\`\`\`

See @docs/REVIEWER_WORKFLOW.md for the authoritative description of what each layer enforces.
```

## Common Issues

### Issue: "Write tool requires manual approval"

**Symptom:** Claude Code asks for permission when creating approval flag

**Solution:**
1. Verify `.claude/settings.json` has exactly `"Write(*)"`
2. NOT `"Write(.git/**/*)"` - this doesn't work
3. Restart Claude Code to reload settings

### Issue: "Approval expired"

**Symptom:** Pre-commit hook says "approval expired (350s old)"

**Solution:**
- Approval is >5 minutes old
- Spawn reviewer again and commit immediately

### Issue: "Hook doesn't run"

**Symptom:** Commits succeed without approval

**Solution:**
```bash
# Verify hook is installed and executable
ls -la .git/hooks/pre-commit
# Should show: -rwxr-xr-x (executable)

# Reinstall if needed
./.githooks/install.sh
```

## What This Does NOT Require

- ❌ Claude Flow - Not required
- ❌ MCP servers - Not required
- ❌ External APIs - Not required
- ❌ Internet connection - Works offline (except for Claude API calls)
- ❌ npm packages - Hook is pure bash
- ❌ Node.js for the hook - Bash only

## What IS Required

- ✅ Claude Code CLI installed
- ✅ Git repository
- ✅ Bash shell (standard on macOS/Linux)
- ✅ Internet for Claude API (only when spawning reviewer)

## Minimal Setup Summary

From scratch, in a new repository:

```bash
# 1. Create hook directory and files
mkdir -p .githooks
# (paste pre-commit and install.sh contents from Step 1)

# 2. Make executable
chmod +x .githooks/*.sh .githooks/pre-commit

# 3. Install hook
./.githooks/install.sh

# 4. Create settings
mkdir -p .claude
# (create settings.json from Step 2)

# 5. Test
echo "test" >> README.md
git add README.md
git commit -m "test"  # Should be BLOCKED
USER_COMMIT=1 git commit -m "test"  # Should work
git reset HEAD~1
git checkout README.md
```

Done! The reviewer workflow is now active.

## Optional: Claude Flow Integration

**This project** uses Claude Flow for additional features like:
- Swarm coordination
- Memory systems
- Advanced hooks
- Multi-agent workflows

But these are **separate** from the reviewer workflow. The reviewer workflow works standalone with just Claude Code.

If you want Claude Flow features, install separately:
```bash
npm install -g @claude-flow/cli
```

But again: **NOT required for the reviewer workflow**.
