# Claude Code Configuration - Jazz-NextJS

**Project**: Next.js headless frontend for jazzsequence.com WordPress site

This document is a **digest** - detailed documentation is in `@docs/`. Load relevant docs at session start.

---

## Critical Behavioral Rules

- Do what has been asked; nothing more, nothing less
- **DRY (Don't Repeat Yourself)**: Minimize code duplication
- **NEVER create files** unless absolutely necessary
- **ALWAYS prefer editing** existing files over creating new ones
- **NEVER proactively create** documentation files unless requested
- **NEVER save to root folder** - use `/src`, `/tests`, `/docs`, `/config`, `/scripts`
- **ALWAYS read files before editing** them
- **NEVER commit secrets**, credentials, or `.env` files
- **NEVER use compound commands** (`cmd1 && cmd2`) - run commands separately for auto-approval

---

## Quick Start

### Essential Commands

```bash
npm test              # Unit tests
npm run lint          # Linter
npm run build         # Build
npm run test:e2e      # E2E tests (MANDATORY)
npm run start:test    # Test standalone build
```

**All 5 commands MUST pass before committing** + Reviewer agent approval

See: `@docs/configuration/build-and-test.md`

### MCP Servers (CRITICAL)

Two MCP servers are registered and available:

**1. `jazzsequence-wordpress`** — 66 tools for live WordPress CRUD and discovery.
**ALWAYS use this FIRST** for understanding jazzsequence.com content structure.

- **Configuration**: `.mcp.json` (project-level — do NOT also add to global `~/.config/claude/mcp.json`)
- **Proxy**: `~/.config/claude/mcp-wordpress-http-proxy.js`
- **Endpoint**: `https://jazzsequence.com/wp-json/mcp/mcp-adapter-default-server`

**2. `mcp__github__*`** — Native GitHub operations (PRs, issues, file reads, code search).
Prefer these over `gh` CLI for reading remote files and creating PRs/issues.

**Full workflow**: `@docs/workflows/mcp-server.md`

### Test-Driven Development

**ALWAYS write tests BEFORE implementation code** (TDD London School)

**Full workflow**: `@docs/workflows/tdd-workflow.md`

### Reviewer Approval Workflow

**Use Write() tool for approval flags** (auto-approved):
```typescript
// After reviewer approves, main agent creates flag:
const timestamp = await Bash({ command: "date +%s" });
await Write({
  file_path: "/Users/chris.reynolds/git/jazz-nextjs/reviewer-approved",
  content: timestamp.trim()
});
```

**DO NOT use cat/echo for approval** - those require manual approval.

See: `@docs/REVIEWER_WORKFLOW.md`

---

## File Organization

```
/src                  # Source code ONLY (no tests)
/tests                # ALL test files (mirror /src structure)
/docs                 # Documentation
/config               # Configuration files
/scripts              # Utility scripts
/examples             # Example code
```

**NEVER save to root folder**

---

## Local Environment

**Available Tools**:
- `ag` (The Silver Searcher) - Faster grep alternative
  - Usage: `ag "pattern" path/`
  - Respects .gitignore automatically
- `jq` - JSON processor for parsing API responses
  - Usage: `curl ... | jq '.field'`
  - Installed and available

**Node.js**: 24.13.0 (matches Pantheon, managed via `.nvmrc`)
**Package Manager**: npm 11.11.0

---

## Documentation Index

### Core Workflows
- `@docs/workflows/mcp-server.md` - WordPress MCP server usage (CRITICAL)
- `@docs/workflows/tdd-workflow.md` - Test-driven development methodology
- `@docs/REVIEWER_WORKFLOW.md` - Pre-commit enforcement (3-layer validation)
- `@docs/REVIEWER_SETUP.md` - Reviewer workflow setup guide

### Configuration
- `@docs/configuration/build-and-test.md` - Build commands & quality checks
- `@docs/configuration/git-workflow.md` - Commit practices & git safety
- `@docs/configuration/DEPLOYMENT.md` - Pantheon deployment procedures

### Architecture & Design
- `@docs/API_CLIENT_DESIGN.md` - WordPress API client architecture
- `@docs/architecture/SLACK_NOTIFICATIONS.md` - Deployment notifications

### Reference
- `@docs/TESTING.md` - Complete testing guide
- `@docs/CONTENT_UPDATES.md` - ISR and content sync strategies
- `@docs/AI_USAGE.md` - AI tool usage and methodology
- `@AGENTS.md` - Project-specific agent instructions
- `@README.md` - Project overview and setup

### Session Notes (Gitignored)
- `docs/SESSION_NOTES.md` - Current session progress
- `docs/EOD_SESSION_NOTES_*.md` - End-of-day snapshots

---

## Session Start Checklist

**At the beginning of EVERY session**:

1. **Load core documentation**:
   - `@AGENTS.md` - Agent instructions
   - `@docs/REVIEWER_WORKFLOW.md` - Enforcement rules
   - `@docs/workflows/mcp-server.md` - MCP usage

2. **Verify MCP server connection**:
   ```typescript
   ListMcpResourcesTool(server="jazzsequence-wordpress")
   ```

3. **Install pre-commit hooks** (if needed):
   ```bash
   ./.githooks/install.sh
   ```

---

## Project Architecture

### Tech Stack
- **Framework**: Next.js 16.1.6 (Turbopack)
- **React**: 19.2.4
- **WordPress**: Headless CMS (jazzsequence.com)
- **Testing**: Vitest 4.0.18, Playwright 1.58.2
- **Styling**: Tailwind CSS 3.4
- **Validation**: Zod schemas with `.passthrough()` for plugin fields

### Design Patterns
- Domain-Driven Design with bounded contexts
- TDD London School (mock-first)
- Generic API design (eliminates duplication)
- Event sourcing for state changes
- Input validation at system boundaries

### WordPress Integration
- **Content Source**: `https://jazzsequence.com/wp-json/wp/v2/`
- **MCP Server**: `https://jazzsequence.com/wp-json/mcp/mcp-adapter-default-server`
- **CDN Images**: `sfo2.digitaloceanspaces.com/cdn.jazzsequence/`
- **ISR**: 3600s revalidation
- **Rate Limiting**: 10 req/sec, burst of 20

**Custom Post Types relevant to this site**: `gc_game` (games — implemented), `media` (YouTube/WordPress.tv — future)

**Out of scope** — these belong to multisite subsites, NOT jazzsequence.com:
- `rb_recipe` (recipes), `plague-artist` (artists), `movie` (movies) — do NOT build pages for these

**Implemented routes**:
- `/` — homepage with posts
- `/posts` — post list with pagination
- `/posts/[slug]` — individual posts
- `/[slug]`, `/[slug]/[child]` — WordPress pages
- `/games` — game collection with filtering + modal (ISR)
- `/tag/[slug]` — tag archives

**Remaining work**:
- `/media` — YouTube/WordPress.tv CPT (navigation + implementation not yet present)
- Articles page — custom Pantheon.io oembed pattern renders differently from standard posts; oembeds don't render headlessly; needs improved layout/display
- Accessibility improvements

---

## Command Execution Rules

### NEVER Use Compound Commands

**WRONG**:
```bash
npm test && git add . && git commit  # ❌ Harder to auto-approve
cmd1 && cmd2 && cmd3                 # ❌ Chains require manual approval
```

**RIGHT**:
```bash
npm test                             # ✅ Separate commands
git add src/file.ts                  # ✅ Auto-approved individually
git commit -m "message"              # ✅ Clean approval flow
```

**Why**: Compound commands with `&&` or `;` are harder for permission system to parse and auto-approve. Run commands separately for smooth workflow.

### Use Write() for Approval Flags

**Auto-approved** (use this):
```typescript
await Write({
  file_path: "/path/to/file",
  content: "content"
})
```

**Requires manual approval** (don't use for automation):
```bash
cat > file << EOF       # ❌ Requires approval
echo "content" > file   # ❌ Requires approval
```

---

## Deployment

**Platform**: Pantheon (Next.js hosting)
**Build**: Standalone mode (required)
**Environments**: Dev, Test, Live

**Before deploying**:
- [ ] All tests pass
- [ ] Build succeeds
- [ ] E2E tests pass
- [ ] Standalone build tested
- [ ] No secrets committed
- [ ] Documentation updated

See: `@docs/configuration/DEPLOYMENT.md`

---

## Security Rules

- **NEVER commit**: Secrets, API keys, `.env` files, credentials
- **ALWAYS validate**: User input at system boundaries
- **ALWAYS sanitize**: File paths (prevent directory traversal)
- Run `npx @claude-flow/cli@latest security scan` after security changes

---

## Claude Flow V3 Configuration

**Topology**: hierarchical-mesh
**Max Agents**: 15
**Memory**: Hybrid (AgentDB with HNSW indexing)
**Neural**: Enabled

### Key Resources
- Swarm orchestration: `swarm-orchestration` skill
- Memory management: `claude-flow-memory` skill
- GitHub operations: `github:*` skills

See: `@docs/AI_USAGE.md` for full AI tool usage

---

## Key Principles

1. **TDD First**: Tests before implementation (London School)
2. **MCP First**: Use MCP server to understand WordPress structure
3. **DRY**: Minimize duplication via generics and abstractions
4. **YAGNI**: Don't build for hypothetical future requirements
5. **Documentation**: Keep docs updated with code changes
6. **Security**: No secrets in code, validate at boundaries
7. **Quality**: All tests + lint + build must pass before commit
8. **Commands**: Run separately, avoid `&&` chaining
9. **Automation**: Use Write() for auto-approved file creation

---

## Support & Resources

- **Documentation**: All detailed docs in `@docs/`
- **Project Issues**: GitHub Issues
- **Claude Code Help**: `/help` command
- **Feedback**: https://github.com/anthropics/claude-code/issues

---

**Last Updated**: 2026-03-14
**Version**: 1.0.0 (Digest format)
