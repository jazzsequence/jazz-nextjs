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

The reviewer workflow has 3 components:

1. **Claude Code's Agent tool** - Built-in, spawns reviewer agents
2. **Pre-commit hook** - Bash script that validates approval flag
3. **Approval flag** - Timestamp file written by main agent

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
Main Agent writes approval flag ← Uses Claude Code's Write tool
    ↓
git commit triggers hook
    ↓
Hook validates flag timestamp
    ↓
Commit allowed/blocked
```

## Step-by-Step Setup

### Step 1: Create Pre-Commit Hook

Create `.githooks/pre-commit`:

```bash
#!/bin/bash
# Pre-commit enforcement: Basic checks before commit allowed

set -e

echo "🔍 Pre-Commit Validation"
echo "=============================="
echo ""

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check 1: Reviewer agent validation (can be bypassed for user commits)
echo "1️⃣  Checking reviewer agent approval..."

# Allow user to bypass reviewer requirement with USER_COMMIT=1
if [ "$USER_COMMIT" = "1" ]; then
    echo -e "${YELLOW}⚠️  User commit bypass enabled${NC}"
    echo "   Skipping reviewer agent check (user-initiated commit)"
elif [ -f .git/hooks/reviewer-approved ]; then
    APPROVAL_TIME=$(cat .git/hooks/reviewer-approved)
    CURRENT_TIME=$(date +%s)
    TIME_DIFF=$((CURRENT_TIME - APPROVAL_TIME))

    # Approval valid for 5 minutes
    if [ $TIME_DIFF -lt 300 ]; then
        echo -e "${GREEN}✅ Reviewer agent approved (${TIME_DIFF}s ago)${NC}"
        rm .git/hooks/reviewer-approved  # Clear approval after use
    else
        echo -e "${RED}❌ BLOCKED: Reviewer approval expired (${TIME_DIFF}s old)${NC}"
        echo "   Spawn reviewer agent again and get fresh approval"
        echo "   OR use: USER_COMMIT=1 git commit (for your own changes)"
        exit 1
    fi
else
    echo -e "${RED}❌ BLOCKED: No reviewer agent approval found${NC}"
    echo "   For AI-generated changes: Spawn reviewer agent and get APPROVE"
    echo "   For your own changes: Use USER_COMMIT=1 git commit -m \"message\""
    exit 1
fi
echo ""

# Check 2: No secrets
echo "2️⃣  Checking for secrets..."
for file in $(git diff --cached --name-only); do
    if [[ "$file" == ".env" ]] || [[ "$file" == *".env."* ]] || [[ "$file" == *"credentials"* ]]; then
        echo -e "${RED}❌ BLOCKED: Attempting to commit secrets: $file${NC}"
        exit 1
    fi
done
echo -e "${GREEN}✅ No secrets${NC}"
echo ""

# Check 3: Manual confirmation (skip for user commits)
if [ "$USER_COMMIT" != "1" ]; then
    echo "3️⃣  Reviewer oversight check..."
    echo -e "${YELLOW}⚠️  MANDATORY: Did you spawn a reviewer agent and get approval?${NC}"
    echo ""
    echo "   If you haven't done this, press Ctrl+C to abort."
    echo "   If you got agent approval, press Enter to continue."
    echo ""

    # Give user 5 seconds to abort if they forgot
    read -t 5 -p "   Press Enter to confirm agent review completed..." || true
    echo ""
else
    echo "3️⃣  Skipping reviewer oversight (user commit)"
    echo ""
fi

echo "=============================="
echo -e "${GREEN}✅ COMMIT ALLOWED${NC}"
echo ""
exit 0
```

Create `.githooks/install.sh`:

```bash
#!/bin/bash
# Install enforcement hooks

echo "Installing enforcement hooks..."

cp .githooks/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit

echo "✅ Pre-commit hook installed"
echo ""
echo "The hook will now:"
echo "  1. Require reviewer agent approval for AI-generated changes"
echo "  2. Block commits with secrets or credentials"
echo "  3. Validate approval is fresh (<5 minutes old)"
echo ""
echo "For your own manual changes:"
echo "  USER_COMMIT=1 git commit -m \"message\""
```

Make executable:
```bash
chmod +x .githooks/install.sh
chmod +x .githooks/pre-commit
```

Install the hook:
```bash
./.githooks/install.sh
```

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
  }
}
```

**Critical permissions explained:**

- `"Write(*)"` - **REQUIRED** - Allows main agent to create approval flag without manual approval
  - More specific paths like `"Write(.git/hooks/reviewer-approved)"` **do NOT work** due to glob matching
  - Must be exactly `"Write(*)"`
- `"Bash(date*)"` - For getting Unix timestamp
- `"Agent(subagent_type=reviewer)"` - Auto-approve spawning reviewer agents

**Note:** `.claude/settings.json` is **project-specific** and **gitignored** by default. Each developer needs to create this file locally.

### Step 3: Create Project Requirements Document

Create `AGENTS.md` or add to `CLAUDE.md`:

```markdown
## Pre-Commit Reviewer Workflow

**REQUIRED before EVERY commit of AI-generated code:**

1. Spawn reviewer agent using Claude Code's Agent tool
2. Get APPROVE decision from agent
3. Main agent creates approval flag
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
4. Claude creates `.git/hooks/reviewer-approved` with timestamp
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

See [REVIEWER_WORKFLOW.md](docs/REVIEWER_WORKFLOW.md) for details.
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
