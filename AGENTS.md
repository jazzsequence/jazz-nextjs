---

# Project-Specific Agent Instructions

## Session Start Protocol - MANDATORY

**STEP 1: Install enforcement hooks**

```bash
./.githooks/install.sh
```

This installs a pre-commit hook that automatically:
- ✅ Runs all unit tests before every commit (npm test)
- ✅ Runs linter before every commit (npm run lint)
- ✅ Validates build succeeds (npm run build)
- ✅ **Runs E2E tests before every commit (npm run test:e2e)** ← CRITICAL
- ✅ Blocks commits containing secrets
- ⚠️ Reminds you to get reviewer agent approval (manual gate)

**Why E2E tests are mandatory:**
E2E tests catch runtime errors that unit tests miss, including:
- Next.js routing conflicts (different dynamic segment names)
- Server startup failures
- Integration issues between components
- Cache invalidation bugs

---

**STEP 2: MANDATORY reviewer approval before EVERY commit**

BEFORE committing, you MUST spawn a reviewer agent and get approval:

```typescript
// Use Claude Code's Agent tool
Agent({
  subagent_type: "reviewer",
  model: "sonnet",
  description: "Pre-commit review",
  prompt: `You are reviewing staged changes for a pre-commit approval decision.

FIRST: Read the project checklist:
Read({ file_path: "docs/REVIEWER_CHECKLIST.md" })

Work through every item in that checklist in order.
Report each item explicitly with ✅ / ❌ / ⏭️ — no silent skips.

Then either APPROVE (write the reviewer-approved flag as instructed in the checklist)
or REJECT (list every failing item with its number and required fix).

CRITICAL: Tests and lint are run by YOU — the pre-commit hook only validates that
you wrote the approval flag.`
}))
```

**IMPORTANT: Use Claude Code's `Agent` tool, NOT `mcp__claude-flow__*` tools**

- **claude-flow MCP tools** (`mcp__claude-flow__*`) create metadata only - they don't execute
- **Claude Code Agent tool** spawns actual working subagents that execute tasks
- This is the key difference that makes enforcement actually work

**Why two-layer enforcement works:**

**Layer 1 - Manual Oversight (Reviewer Agent) - RUNS FIRST:**
- Spawned BEFORE staging/committing
- Runs tests, lint, build (once, not duplicate)
- Comprehensive review of ALL rules
- Checks documentation updates, TDD methodology, file organization, license compatibility
- Creates approval flag file if everything passes
- Approval valid for 5 minutes

**Layer 2 - Automated Gate (Pre-commit Hook) - RUNS SECOND:**
- Checks for reviewer approval flag file
- Blocks commit if no approval or approval expired
- Does NOT re-run tests/lint (agent already did that)
- Only checks secrets as secondary validation
- Fast execution since agent did heavy lifting

**The reviewer agent will check:**
See `docs/REVIEWER_CHECKLIST.md` for the full checklist the reviewer works through.
Section A items run on every commit. Section B items are conditional (skipped with ⏭️ when not applicable).

**CRITICAL WORKFLOW:**
1. Make changes (edit files, write code)
2. Spawn reviewer agent BEFORE staging (reviewer runs tests/lint)
3. Reviewer evaluates — if APPROVE, reviewer writes the approval flag itself
4. If reviewer says REJECT, fix violations and spawn reviewer again
5. NOW stage files with git add (only after reviewer has written the flag)
6. Commit — pre-commit hook validates the flag exists and is fresh
7. If approval expired (>5 min), get a fresh reviewer approval

**CRITICAL RULES:**
- Never stage files before the reviewer agent has approved
- Never commit without APPROVE + flag written by the reviewer agent
- **NEVER write reviewer-approved yourself** — only the reviewer agent may write it
- **NEVER use `USER_COMMIT=1`** — this bypass exists for the human to use on their own commits, not for the AI agent. If an AI-generated commit is blocked by size or reviewer checks, fix the root cause: split the commit or get reviewer approval.
- **NEVER tell the reviewer to APPROVE** — you do not dictate the verdict. Telling the reviewer
  "please APPROVE" or "APPROVE this" undermines the independence of the review and gives the
  impression of circumventing the system. Describe the change clearly and let the reviewer decide.
- If reviewer says REJECT, fix violations then spawn reviewer again
- Approval expires after 5 minutes (prevents stale approvals)
- Hook does NOT re-run tests (reviewer already did that)

**TRANSPARENCY:**
Both the main agent and the reviewer agent must surface what they are doing to the
user in chat at every step. The user watches the conversation to verify the review
process is genuine — your visible actions are the audit trail.

Main agent: state what you are about to commit, why you are spawning the reviewer,
and that you are waiting for reviewer approval before staging.

Reviewer agent: state which tests you ran, what you checked, your APPROVE/REJECT
verdict with specific findings, and confirm explicitly that you wrote (or did not
write) the reviewer-approved flag.

**REVIEWER — NO COMPOUND COMMANDS:**
Run each validation step as a separate Bash call. Never chain commands with `&&`,
`;`, or pipes. Compound commands require manual human approval in this project and
will stall the workflow. Correct pattern:
```
Bash({ command: "npm test" })         // ✅ separate call
Bash({ command: "npm run lint" })     // ✅ separate call
Bash({ command: "npm run build" })    // ✅ separate call
```
Not:
```
Bash({ command: "npm test && npm run lint && npm run build" })  // ❌ blocked
```

---

**STEP 3: Connect to WordPress MCP Server**

At session start, verify MCP server connection is active:

```typescript
// Check MCP server is connected
ListMcpResourcesTool({ server: "jazzsequence-wordpress" })
```

If not connected, restart Claude Code. The MCP server provides AI-native access to WordPress content structure at jazzsequence.com.

**See "WordPress MCP Server Workflow" section below for full usage instructions.**

---

## WordPress MCP Server Workflow - CRITICAL

**ALWAYS use the WordPress MCP server as your FIRST resource for understanding jazzsequence.com.**

### Why MCP Server Matters

The MCP server provides:
- **Schema discovery** - Automatic introspection of WordPress structure
- **Content exploration** - Query custom post types, taxonomies, metadata
- **Field mapping** - Understand plugin-added fields and custom fields
- **Relationship mapping** - Discover content relationships
- **CRUD operations** - Create/read/update/delete content when needed

**Use MCP BEFORE making assumptions about WordPress data structure.**

### Available MCP Tools

**Core Abilities**:
```typescript
// Discover all registered WordPress abilities
mcp-adapter-discover-abilities

// Get detailed schema for specific ability
mcp-adapter-get-ability-info({ ability_name: "..." })

// Execute WordPress abilities
mcp-adapter-execute-ability({ ability_name: "...", params: {...} })
```

**Content Abilities** (via jazzsequence-mcp-abilities plugin):
- Create/read/update/delete posts, pages, custom post types
- Query posts by criteria (post type, taxonomy, meta, date ranges)
- Manage post metadata and featured images

**Media Abilities**:
- Upload/query media files
- Update media metadata

**Taxonomy Abilities**:
- Manage categories, tags, custom taxonomies
- Query term relationships

**NinjaForms Abilities**:
- Create/manage forms, fields, actions, calculations
- 15+ form management tools

### MCP Usage Examples

**Example 1: Discover Custom Post Types**
```
User asks: "What custom post types exist?"

AI: Use mcp-adapter-discover-abilities or mcp-adapter-execute-ability
→ Result: gc_game, rb_recipe, plague-artist, movie, ab_address, media

AI: "jazzsequence.com has these custom post types: games (gc_game), recipes (rb_recipe), artists (plague-artist), movies (movie), addresses (ab_address), and media."
```

**Example 2: Understand Post Type Schema**
```
User asks: "What fields does gc_game have?"

AI: Use mcp-adapter-get-ability-info for gc_game abilities
→ Result: Full schema with all custom fields, metadata, taxonomies

AI: "The gc_game post type has these fields: [list fields from schema]"
```

**Example 3: Query Recent Content**
```
User asks: "Show me the latest 5 game posts"

AI: Use mcp-adapter-execute-ability with query parameters
→ Result: Latest 5 gc_game posts with all metadata

AI: "Here are the latest 5 games: [format results]"
```

### MCP vs REST API - When to Use What

**Use MCP Server for**:
- ✅ Schema discovery and introspection
- ✅ Understanding WordPress content structure
- ✅ Exploring custom fields and metadata
- ✅ Discovering post types and taxonomies
- ✅ Content relationship mapping
- ✅ CRUD operations (when needed for testing/admin)

**Use REST API Client (`src/lib/wordpress/client.ts`) for**:
- ✅ Production data fetching (faster, cached)
- ✅ ISR integration with Next.js
- ✅ Bulk content queries
- ✅ Public-facing content delivery
- ✅ Client-side data fetching

**They work together**: MCP informs schema understanding, REST API delivers production content.

### Workflow Pattern

**Correct Workflow**:
```typescript
// 1. FIRST: Use MCP to understand schema
AI asks MCP: "What fields does gc_game have?"
MCP returns: Full schema with custom fields

// 2. THEN: Use REST API client with informed understanding
const games = await fetchPosts('gc_game', {
  perPage: 10,
  // Now we know what fields to expect from MCP discovery
})
```

**WRONG Workflow**:
```typescript
// ❌ NEVER: Guess schema without checking MCP
const games = await fetchPosts('gc_game', { perPage: 10 })
// What fields exist? What metadata? ¯\_(ツ)_/¯ Guessing...
```

### MCP Server Configuration

**Endpoint**: `https://jazzsequence.com/wp-json/mcp/mcp-adapter-default-server`
**Server Name**: `jazzsequence-wordpress` (in project-level `.mcp.json`)
**Proxy**: `~/.config/claude/mcp-wordpress-http-proxy.js`

**Troubleshooting**:
If MCP server not available:
1. Check project-level `.mcp.json` exists
2. Verify proxy script exists
3. Restart Claude Code
4. See `docs/SESSION_NOTES.md` for full setup details

## Critical Development Workflows

### 1. Test-Driven Development (TDD) - MANDATORY

**ALWAYS write tests BEFORE implementing functionality:**

```bash
# TDD Workflow (London School - Mock-first)
1. Write failing test first
2. Run test to confirm it fails: npm test -- --run
3. Implement minimal code to pass test
4. Run test to confirm it passes
5. Refactor if needed
6. Repeat

# Before ANY commit:
npm test -- --run     # All unit tests must pass
npm run lint          # No ESLint errors
npm run test:e2e      # E2E tests must pass
```

**Never commit code without:**
- ✅ Tests written first
- ✅ All tests passing (683 unit tests)
- ✅ ESLint clean
- ✅ E2E tests passing (150 E2E tests)

See: `/docs/TESTING.md` for full TDD methodology

### 2. WordPress Tasks - Use Available Skills

**When working with WordPress:**
- Use `Skill` tool with `wp-rest-api` for WordPress REST API tasks
- Use `wp-wpcli-and-ops` for WP-CLI operations
- Use `wp-block-development` for Gutenberg blocks
- Use `wp-plugin-development` for plugin work

**Example:**
```
User asks: "Fetch WordPress posts"
→ Invoke: Skill tool with skill="wp-rest-api"
```

**Available WordPress Skills:**
- `wp-rest-api` - REST API endpoints/routes
- `wp-wpcli-and-ops` - WP-CLI operations
- `wp-block-development` - Gutenberg blocks
- `wp-plugin-development` - Plugin architecture
- `wp-block-themes` - Block themes
- `wp-interactivity-api` - Interactivity API

### 3. Complex Tasks - Spawn Agent Swarms

**When tasks are complex or multi-step, use Agent tool:**

**Use Agent tool when:**
- Task requires 3+ distinct steps
- Multiple independent operations can run in parallel
- Deep research or exploration needed
- Testing multiple approaches

**Available specialized agents:**
- `coder` - Implementation specialist
- `tester` - Testing and QA
- `reviewer` - Code review
- `researcher` - Deep research
- `explorer` - Codebase exploration
- `planner` - Task planning

**Example:**
```typescript
// Complex feature: Add authentication system
// → Use Agent tool with subagent_type="planner" first
// → Then spawn parallel agents for frontend, backend, tests
```

**DO NOT use Agent tool for:**
- Simple, single-file changes
- Tasks you can complete in 1-2 steps
- Reading specific files (use Read/Grep instead)

### 4. Project Architecture

**WordPress Headless CMS Integration:**
- Content from: `https://jazzsequence.com/wp-json/wp/v2/`
- ISR: 3600s revalidation
- Rate limiting: 10 req/sec, burst of 20
- CDN images: `sfo2.digitaloceanspaces.com/cdn.jazzsequence/`

**Custom Post Types:**
- `gc_game` - Games
- `rb_recipe` - Recipes
- `plague-artist` - Artists
- `movie` - Movies
- `ab_address` - Address book
- `media` - YouTube/WordPress.tv

**File Organization:**
- `/src` - Source code ONLY (no tests)
- `/tests` - ALL test files (mirror `/src` structure)
- `/docs` - Documentation
- `/config` - Configuration files
- `/scripts` - Build and utility scripts

**NEVER:**
- Save files to root folder
- Create documentation unless requested
- Commit `.env` files or secrets

### Deployment Authorization — HARD RULE

**NEVER merge code to the `test` or `live` branches unless the user explicitly requests it.**

Merging to `test` or `live` triggers a Pantheon environment deployment. This is a production-affecting action that requires explicit user authorization every time. "Deploy to test" or "deploy to live" or "promote to test/live" from the user is required — do not infer or assume it is desired as part of any other task.

- `main` branch → Dev environment (safe to push as part of normal work)
- `test` branch → Pantheon Test environment (**requires explicit user request**)
- `live` branch → Pantheon Live environment (**requires explicit user request**)

If asked to "deploy" without specifying an environment, clarify before acting.

### 5. Documentation Maintenance - Keep Docs Updated

**When making changes, ALWAYS update relevant documentation:**

**Update when:**
- Workflow changes → Update `/CLAUDE.md` and this file (`agents.md`)
- Architecture changes → Update `/README.md` and `/docs/` files
- New features → Update feature documentation in `/docs/`
- Configuration changes → Update deployment docs
- API changes → Update API documentation

**Documentation files to maintain:**
- `/README.md` - Project overview, setup, usage
- `/CLAUDE.md` - Agent behavioral rules and conventions
- `/agents.md` - This file (project-specific instructions)
- `/docs/*.md` - Feature-specific documentation
- `/docs/SESSION_NOTES.md` - Session progress (gitignored)

**Example:**
```
Code change: Add new WordPress custom post type
→ Update: README.md (add to custom post types list)
→ Update: docs/API_CLIENT_DESIGN.md (document new endpoint)
→ Update: CLAUDE.md (if workflow changes)
```

**Keep documentation in sync with code changes - stale docs are worse than no docs.**

See: `/CLAUDE.md` for complete behavioral rules and conventions

<!-- BEGIN:pantheon-api-helper -->
## Pantheon API

Pre-generated Pantheon API docs are installed in `.pantheonapi-docs/`.

**Start here:** `.pantheonapi-docs/digest.md` — overview, key patterns, section index.

| Section | File |
|---------|------|
| Auth (1 endpoint) | `.pantheonapi-docs/auth/endpoints.md` |
| Organizations (12 endpoints) | `.pantheonapi-docs/organizations/endpoints.md` |
| Sites (66 endpoints, sub-indexed) | `.pantheonapi-docs/sites/digest.md` |
| Users (10 endpoints) | `.pantheonapi-docs/users/endpoints.md` |
| All schemas (119 definitions) | `.pantheonapi-docs/schemas/index.md` |

Before writing any code that calls the Pantheon API, read the relevant section file.
The sites section is large — always read `.pantheonapi-docs/sites/digest.md` first to
navigate to the correct sub-section (environments, backups, domains, code, etc.).

**API base:** `https://api.pantheon.io`
**Auth:** `Authorization: Bearer <machine-token>`
**Async pattern:** Write ops return a workflow ID — poll `GET /v0/sites/{id}/workflows/{workflow_id}` for status.
<!-- END:pantheon-api-helper -->

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
