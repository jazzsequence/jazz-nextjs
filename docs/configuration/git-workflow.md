# Git Workflow & Commit Practices

## Pre-Commit Validation

**MANDATORY**: All commits require reviewer agent approval. See `@docs/REVIEWER_WORKFLOW.md` for full details.

**Three-layer enforcement**:
1. **PreToolUse Hook** - Blocks git commit before it executes
2. **Pre-commit Hook** - Secondary validation after commit starts
3. **Behavioral** - AI spawns reviewer proactively

## Git Command Workflow

**IMPORTANT**: NEVER chain git commands with `&&` or `;`

**Correct workflow**:
```bash
npm test -- --run  # Separate command
npm run lint       # Separate command
git add src/file.ts
git commit -m "message"
```

**WRONG** (do not do this):
```bash
npm test && git add . && git commit -m "message"  # ❌ Don't chain
```

## Commit Standards

### Conventional Commits

Follow [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Formatting, missing semi colons, etc.
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Performance improvement
- `test`: Adding missing tests
- `chore`: Updating build tasks, package manager configs, etc.

### Co-Authoring

**All commits must include co-author attribution**:

```bash
git commit -m "feat: add new feature

Co-Authored-By: Claude <claude@anthropic.com>"
```

**Note**: Use `claude@anthropic.com`, NOT `claude-flow@anthropic.com`

### Commit Message Format

Use HEREDOC for multi-line commits:

```bash
git commit -m "$(cat <<'EOF'
feat(api): add WordPress MCP integration

- Add stdio-to-HTTP proxy for MCP server
- Configure Claude Code MCP client
- Document MCP workflow in CLAUDE.md

Co-Authored-By: Claude <claude@anthropic.com>
EOF
)"
```

## Incremental Commits

- Make **small, focused commits** as work progresses
- Each logical unit of work should be committed separately
- **NEVER amend commits** - always create new commits instead
- First commit may be larger, subsequent commits should be atomic

**Why no amending?**
- Amended commits require force push (forbidden)
- Preserves complete history
- Easier to revert specific changes

## Commit Safety

### NEVER

- ❌ Commit secrets, `.env` files, or credentials
- ❌ Use `git commit --no-verify` (bypasses hooks)
- ❌ Use `git commit --amend` (requires force push)
- ❌ Force push to `main`/`master`
- ❌ Chain git commands with `&&`
- ❌ Stage all files with `git add .` (use specific files)

### ALWAYS

- ✅ Get reviewer agent approval before committing
- ✅ Run all tests before staging files
- ✅ Stage specific files by name
- ✅ Create new commits (not amend)
- ✅ Include co-author attribution
- ✅ Write clear, descriptive commit messages

## Allowed Prompts

**Project-specific auto-approved commands** (`.claude/settings.json`):

```json
{
  "permissions": {
    "allow": [
      "Bash(git commit *)",
      "Bash(git add *)"
    ]
  }
}
```

Both `git add` and `git commit` are auto-approved for smooth TDD workflow in this project only.

## Reviewer Workflow Integration

### Complete Flow

1. **Make changes** - Edit files, write code
2. **Run tests locally** - Verify all pass
3. **Spawn reviewer agent** - Get approval BEFORE staging
4. **Create approval flag** - Main agent writes timestamp
5. **Stage files** - `git add specific-file.ts`
6. **Commit** - Pre-commit hook validates approval

### Approval Flag

**Location**: `.git/hooks/reviewer-approved`
**Content**: Unix timestamp
**Lifetime**: 5 minutes

**Created by main agent after reviewer approves**:
```typescript
const timestamp = await Bash({ command: "date +%s" });
await Write({
  file_path: "/Users/chris.reynolds/git/jazz-nextjs/.git/hooks/reviewer-approved",
  content: timestamp.trim()
});
```

## User Bypass

For manual commits (not AI-generated):

```bash
USER_COMMIT=1 git commit -m "Your commit message"
```

This bypasses reviewer approval requirement.

## Branch Strategy

**Main branch**: `main`
- Production-ready code only
- All changes via reviewer-approved commits
- Never force push

**Feature branches**: Optional
- For experimental work
- Merge to main via reviewed commits
- Delete after merge

## Pull Requests

When creating PRs:

1. **Title**: Short (under 70 characters)
2. **Description**: Detailed summary, test plan
3. **Link issues**: Reference relevant issues/tickets
4. **All checks passing**: Tests, lint, build before creating PR

**Example PR description**:
```markdown
## Summary
- Add WordPress MCP integration
- Configure stdio-to-HTTP proxy
- Document workflow

## Test Plan
- [ ] Unit tests pass
- [ ] E2E tests pass
- [ ] MCP server connects successfully
- [ ] Documentation updated

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## Resources

- Reviewer Workflow: `@docs/REVIEWER_WORKFLOW.md`
- Reviewer Setup: `@docs/REVIEWER_SETUP.md`
- Conventional Commits: https://www.conventionalcommits.org/
- Pantheon Skills (commit conventions): `pantheon-skills:commit-conventions`
