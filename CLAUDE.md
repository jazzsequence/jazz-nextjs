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
- **NEVER merge to `test` or `live` branches** without explicit user request — these trigger Pantheon environment deployments. `main` is safe; `test` and `live` are not.
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
npm run revalidate    # Force ISR cache revalidation (all tags, dev env)
```

**Cache revalidation**: `npm run revalidate [-- tag [tag...]]` busts ISR cache on Pantheon dev by default.
Use `BASE_URL=https://... npm run revalidate` to target another environment.
Needed after: WordPress menu changes, any content edits not auto-revalidated via webhook.

**All 5 commands MUST pass before committing** + Reviewer agent approval

**Exception**: commits whose staged files all match `REVIEWER_TEXT_ONLY_PATTERN` in `.reviewer-config.sh` skip the test suite automatically. It is a blocklist by extension, not a path allowlist, so a new file type runs the full suite by default rather than being silently exempt.

**E2E test output**: Always redirect E2E output to a file for efficient debugging:
```bash
npm run test:e2e -- --reporter=line 2>/tmp/e2e-output.txt; echo "exit:$?"
grep -E "failed|Error|FAIL" /tmp/e2e-output.txt | head -20
```
Never re-run E2E tests just to find a specific error — write to file first, grep after.

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

**The reviewer agent writes the approval flag** on APPROVE using Write() (auto-approved).
The flag is `<unix-timestamp> <index-fingerprint>` — the fingerprint binds the approval
to the exact staged content, so restaging after a review invalidates it:
```typescript
// Reviewer agent writes this file on APPROVE, as its LAST action:
const flag = await Bash({
  command: 'printf "%s %s" "$(date +%s)" "$(bash .githooks/lib/approval.sh fingerprint)"'
});
await Write({
  file_path: "/Users/chris.reynolds/git/jazz-nextjs/reviewer-approved",
  content: flag.trim()
});
```

Write it **last**, after all verification. Staging or unstaging anything afterwards
changes the index fingerprint and invalidates the flag you just wrote. A bare
timestamp (the pre-binding v1 format) is rejected.

**DO NOT use cat/echo for approval** - those require manual approval.

**NEVER tell the reviewer to APPROVE** — the reviewer decides independently. Describing the change and saying "APPROVE this" undermines review integrity and gives the impression of circumventing the system. Describe the change factually and let the reviewer reach its own verdict.

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
- **Framework**: Next.js 16.2.12 (Turbopack) — pinned exactly, see the version-pin note below
- **React**: 19.2.8
- **WordPress**: Headless CMS (jazzsequence.com)
- **Testing**: Vitest 4.1.11, Playwright 1.62.1
- **Styling**: Tailwind CSS 4.3 (config via `@theme` in `app/globals.css`; `@variant hover (&:hover)` restores unconditional hover behavior; no `tailwind.config.js`)
- **Validation**: Zod 4 schemas with `.passthrough()` for plugin fields; `z.record()` requires explicit key schema; `ZodError.issues` (not `.errors`)
- **HTML Sanitization**: `sanitize-html` (PostContent, server-side); `dompurify` (GreetingClient, client-side); `stripHtml()` util (PostCard/SearchResults excerpts)
- **CDN cache invalidation**: `@pantheon-systems/nextjs-cache-handler` v0.11.0 manages edge cache clearing internally. The `GcsCacheHandler` (configured in `cacheHandler.mjs`) maintains a tag-to-key mapping in GCS and calls the Pantheon outbound proxy directly on `revalidateTag()` / `revalidatePath()`. The previous `proxy.ts` Surrogate-Key middleware and `scripts/patch-cache-handler.mjs` postinstall patch have been removed as part of the v0.6.0 migration.
  - **As of v0.9.0**, `revalidateTag()` no longer *deletes* the cache entries it revalidates — it marks them stale via the shared `tagsManifest` (matching Next's own `FileSystemCache.revalidateTag`), so the last-good value stays servable while Next revalidates in the background. This is why high-cardinality tags are now fast: revalidating `posts` (homepage + every archive + every post) previously triggered a synchronous delete-sweep that held the webhook connection open past the client timeout and failed three `/api/revalidate` E2E tests. Confirmed fixed on the PR-78 Pantheon environment.
- **Next.js is pinned to exactly `16.2.12`** (no caret). The **16.3.x line** fails Pantheon's buildpack at "Finalizing page optimization" with `ENOENT: .next/next-server.js.nft.json`, which `output: 'standalone'` requires. It does **not** reproduce locally — only in Pantheon's Linux buildpack under Turbopack. Re-validate on a PR environment before moving to 16.3.x; do not assume it is still broken.
  - Re-validated 2026-08-31 on 16.3.3 (pr-88 build `1fe23cd4`) and 2026-09-01 on 16.3.4
    (pr-94 build `1fe6a733`): both still fail, byte-identical `ENOENT`. Three releases, one
    error — treat 16.3.x as broken, not flaky.
  - Moved 16.2.7 → 16.2.12 the same day: a patch bump within the working minor line that clears all nine open advisories (all patched in 16.2.11). See the "Next.js version pin" section in `@docs/configuration/DEPLOYMENT.md`.

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

**Custom Post Types relevant to this site**: `gc_game` (games — implemented), `media` (YouTube/WordPress.tv — implemented)

**Out of scope** — these belong to multisite subsites, NOT jazzsequence.com:
- `rb_recipe` (recipes), `plague-artist` (artists), `movie` (movies) — do NOT build pages for these

### Altis Experience Blocks / Personalization

The homepage greeting is powered by **Altis Accelerate Experience Blocks**. See `@docs/PERSONALIZATION.md` for full details.

Key facts:
- Block ID `16738` = the greeting reusable block in WordPress
- Variants and audiences are fetched at runtime — no code changes needed to add new variants/audiences in WordPress, as long as they use supported rule fields (`metrics.hour`, `metrics.day`, `endpoints.country`, etc.)
- Adding a **new** Experience Block to a different part of the site requires: a new fetcher in `src/lib/wordpress/`, a server+client component pair, and E2E test coverage
- Matching runs client-side (browser timezone); country detection is server-side (CDN headers)

**Buildpack restriction**: Do NOT commit `.php` files to this repository. PHP files trigger Pantheon's PHP buildpack, which prevents the Node.js runtime from installing correctly and causes `DEPLOYMENT_FAILURE`. WordPress PHP code belongs in the `jazzsequence.com` repository.

**Implemented routes**:
- `/` — homepage with posts + Altis personalized greeting
- `/page/[page]` — homepage pagination
- `/posts` — post list with pagination
- `/posts/[slug]` — individual posts
- `/posts/page/[page]` — paginated posts archive pages
- `/[slug]`, `/[slug]/[child]` — WordPress pages
- `/games` — game collection with filtering + modal (ISR)
- `/media` — media CPT listing (paginated, 12/page) + `/media/[slug]` detail pages
- `/media/page/[page]` — paginated media archive pages
- `/tag/[slug]` — tag archives
- `/category/[slug]` — category archives
- `/series/[slug]` — series archives (Organize Series plugin)
- `/search` — search results page (revalidate=0, always fresh; filter tabs: All/Posts/Media)
- `/style-guide` — style guide page


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

**Last Updated**: 2026-03-30
**Version**: 1.0.0 (Digest format)
