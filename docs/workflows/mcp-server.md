# MCP Server Workflow

**ALWAYS use the WordPress MCP server as your FIRST resource for understanding jazzsequence.com content structure, schemas, and capabilities.**

---

## Overview

Two MCP servers are registered in this project:

| Server | Purpose | Config |
|--------|---------|--------|
| `jazzsequence-wordpress` | Live WordPress CRUD and discovery for jazzsequence.com | `.mcp.json` |
| `mcp__github__*` | Native GitHub operations (PRs, issues, files, code) | System (Claude Code built-in) |

MCP tools are callable natively — no curl, no `gh` CLI, no REST client boilerplate. Just invoke the tool directly.

---

## jazzsequence-wordpress MCP

### Architecture

Claude Code requires stdio MCP servers. jazzsequence.com's MCP endpoint speaks HTTP with session management (`mcp-session-id` header). A Node.js proxy bridges them:

```
Claude Code (stdio)
       ↕ JSON-RPC over stdin/stdout
~/.config/claude/mcp-wordpress-http-proxy.js
       ↕ HTTPS + Basic Auth + mcp-session-id
https://jazzsequence.com/wp-json/mcp/mcp-adapter-default-server
       ↕ WordPress Abilities API
jazzsequence-mcp-abilities plugin (v0.1.6+)
```

### Configuration

**Project config** (what Claude Code CLI reads):
```
.mcp.json → jazzsequence-wordpress entry
```

**Proxy**: `~/.config/claude/mcp-wordpress-http-proxy.js`

**Credentials**: stored in `.mcp.json` env block (WordPress Application Password for `claude-mcp` user)

**Do NOT** use `~/.config/claude/mcp.json` for this server — having it in both places causes a duplicate conflict where tools show 0 capabilities.

### How the Proxy Works

The proxy is designed for fast startup so tools register at session start:

1. **Startup**: Loads 66 tools from `/tmp/wp-mcp-tools-cache.json` instantly (<1ms)
2. **`initialize`**: Responds immediately with cached server info (no HTTP wait)
3. **`tools/list`**: Responds immediately from cache (<1ms)
4. **Background**: Establishes WordPress session (~300ms HTTP round-trip)
5. **Cache refresh**: If tools changed, sends `notifications/tools/list_changed` so Claude Code re-fetches
6. **`tools/call`**: Uses the live WordPress session (waits for background session if needed)

**Why the cache matters**: Claude Code has a hard timeout for `tools/list`. If the response takes >~200ms, it silently marks the server as having 0 capabilities. The proxy must respond instantly.

### Schema Stripping

The proxy strips two JSON Schema keywords before serving tools to Claude Code:

- **`enum`** — Claude Code silently rejects the entire tools list if any `inputSchema` property contains this keyword
- **`default`** — same rejection behavior

These keywords are valid JSON Schema but are not supported by Claude Code's MCP client. The WordPress tools use `enum` extensively for `format` parameters.

### Tools Available (66 total)

**Discovery** (read-only site introspection):
- `jazzsequence-mcp-discover-post-types` — all registered post types with full schema
- `jazzsequence-mcp-discover-taxonomies` — taxonomy structure and terms
- `jazzsequence-mcp-discover-plugins` — active plugins with versions
- `jazzsequence-mcp-discover-theme-structure` — active theme info
- `jazzsequence-mcp-discover-menus` — menu locations and items
- `jazzsequence-mcp-discover-shortcodes` — registered shortcodes
- `jazzsequence-mcp-discover-hooks` — action/filter hooks
- `jazzsequence-mcp-discover-blocks` — registered blocks and patterns
- `jazzsequence-mcp-discover-options` — site options and theme mods
- `jazzsequence-mcp-discover-rewrite-rules` — permalink and rewrite structure
- `jazzsequence-mcp-discover-custom-fields` — CMB2/ACF field groups
- `jazzsequence-mcp-discover-cron-jobs` — scheduled tasks
- `jazzsequence-mcp-discover-capabilities` — user roles and capabilities

**Content CRUD**:
- `jazzsequence-mcp-create-post` — params: `post_title`, `post_content`, `post_status`, `post_type`, `meta_input`, `tax_input`
- `jazzsequence-mcp-update-post` — params: `ID` (required), plus any of the above
- `jazzsequence-mcp-delete-post` — params: `ID`, `force_delete`
- `jazzsequence-mcp-get-post` — params: `ID`
- `jazzsequence-mcp-query-posts` — params: `post_type`, `posts_per_page`, `paged`, `post_status`, `orderby`, `order`, `s`, `tax_query`, `meta_query`

**Taxonomy**:
- `jazzsequence-mcp-create-term` / `update-term` / `delete-term` / `get-term`
- All require `taxonomy` and `term_id` (or `name` for create)

**Media**:
- `jazzsequence-mcp-upload-media-url` — params: `url` (required), `title`, `alt`, `description`
- `jazzsequence-mcp-upload-media-base64` — params: `data`, `filename` (both required)
- `jazzsequence-mcp-update-media` / `delete-media` / `get-media` — all use `ID`

**Operations**:
- `jazzsequence-mcp-clear-cache` — params: `types` (array, optional)
- `jazzsequence-mcp-run-cron` — params: `hook`
- `jazzsequence-mcp-schedule-cron` / `unschedule-cron`
- `jazzsequence-mcp-get-option` / `update-option` / `delete-option` — all use `option_name`

**Meta-tools** (Abilities API introspection):
- `mcp-adapter-discover-abilities` — list all registered abilities by name
- `mcp-adapter-get-ability-info` — get full schema for an ability by name
- `mcp-adapter-execute-ability` — execute any ability by name with `parameters` object

**Ninja Forms** (29 tools): full form creation, field management, submission handling, exports

### Calling Tools

**Direct tool calls** (preferred — use the parameter names from the schema):
```
jazzsequence-mcp-get-post with {ID: 16867}
jazzsequence-mcp-create-post with {post_title: "...", post_status: "draft"}
jazzsequence-mcp-update-post with {ID: 16867, meta_input: {autoblue_custom_message: "..."}}
jazzsequence-mcp-query-posts with {post_type: "gc_game", posts_per_page: 10}
```

**Via execute-ability** (fallback if direct tool has schema issues):
```
mcp-adapter-execute-ability with {
  ability_name: "jazzsequence-mcp/create-post",
  parameters: {post_title: "...", post_status: "draft"}
}
```

Note: ability names in execute-ability use slash notation (`jazzsequence-mcp/create-post`), while the MCP tool names use hyphens (`jazzsequence-mcp-create-post`).

### Common Patterns

**Discover site structure before building a feature**:
```
1. jazzsequence-mcp-discover-post-types → understand what post types exist
2. jazzsequence-mcp-discover-custom-fields → find CMB2/ACF fields for a CPT
3. jazzsequence-mcp-query-posts {post_type: "gc_game", posts_per_page: 1} → see real data shape
4. Build Zod schema based on actual data
```

**Draft and schedule a post**:
```
1. jazzsequence-mcp-create-post {post_title: "...", post_status: "draft", post_content: "..."}
2. jazzsequence-mcp-update-post {ID: <id>, meta_input: {autoblue_custom_message: "..."}}
→ autoblue_custom_message is saved as post meta and used by Autoblue on publish
```

### Troubleshooting

**0 capabilities in `/mcp` menu**:
1. Check that `jazzsequence-wordpress` is ONLY in `.mcp.json`, not also in `~/.config/claude/mcp.json`
2. Delete the tools cache and restart: `rm /tmp/wp-mcp-tools-cache.json && claude`
3. Check the debug log: `cat /tmp/mcp-proxy-debug.log`

**Tools cache**:
- Location: `/tmp/wp-mcp-tools-cache.json`
- Auto-regenerated on every session start
- Safe to delete if stale — rebuilds in background on next startup

**Debug log**: `/tmp/mcp-proxy-debug.log` — logs every request/response through the proxy

**Test the proxy manually**:
```bash
printf '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-11-25","capabilities":{},"clientInfo":{"name":"test","version":"1"}}}\n{"jsonrpc":"2.0","method":"notifications/initialized"}\n{"jsonrpc":"2.0","id":2,"method":"tools/list"}\n' | \
  WORDPRESS_MCP_ENDPOINT="https://jazzsequence.com/wp-json/mcp/mcp-adapter-default-server" \
  WORDPRESS_USERNAME="claude-mcp" \
  WORDPRESS_APP_PASSWORD="<app-password-from-.mcp.json>" \
  node ~/.config/claude/mcp-wordpress-http-proxy.js 2>/dev/null | head -c 500
```

---

## GitHub MCP

The GitHub MCP is built into Claude Code and registered automatically. It provides native access to GitHub without needing the `gh` CLI.

### Available Operations

**Pull requests**:
- `mcp__github__create_pull_request` — create a PR between branches
- `mcp__github__pull_request_read` — get PR details, diff, files changed, check runs, review comments
- `mcp__github__update_pull_request` — update title, body, reviewers, state
- `mcp__github__merge_pull_request` — merge with squash/rebase/merge strategies
- `mcp__github__list_pull_requests` — list open/closed PRs

**Issues**:
- `mcp__github__issue_read` — get issue details, comments, sub-issues
- `mcp__github__issue_write` — create or update issues
- `mcp__github__list_issues` — list and filter issues
- `mcp__github__add_issue_comment` — comment on an issue

**Files and code**:
- `mcp__github__get_file_contents` — read any file from any repo/branch/ref
- `mcp__github__create_or_update_file` — create or update a file (commits directly)
- `mcp__github__push_files` — push multiple files in one commit
- `mcp__github__delete_file` — delete a file
- `mcp__github__search_code` — search code across GitHub

**Repository**:
- `mcp__github__list_branches` — list branches
- `mcp__github__create_branch` — create a branch
- `mcp__github__get_commit` — get commit details
- `mcp__github__list_commits` — list commits on a branch

**Search**:
- `mcp__github__search_repositories` — find repos
- `mcp__github__search_issues` — find issues/PRs
- `mcp__github__search_pull_requests` — find PRs

### When to Use GitHub MCP vs gh CLI

**Use GitHub MCP** (preferred) for:
- Reading file contents from a repo without cloning locally
- Creating/updating PRs and issues
- Reading PR diffs, check runs, review comments
- Searching code or issues across GitHub
- Pushing individual file changes to a branch

**Use `gh` CLI** (via Bash tool) for:
- Interactive operations not covered by MCP
- Complex git operations (merges requiring conflict resolution)
- Authenticated actions needing local git state

### GitHub MCP for jazzsequence.com Backend

When making changes to the jazzsequence.com WordPress backend, the GitHub MCP replaces the need to clone the repo locally:

```
# Read a file from the backend repo
mcp__github__get_file_contents {
  owner: "jazzsequence",
  repo: "jazzsequence.com",
  path: "wp-content/plugins/jazzsequence-mcp-abilities/includes/bootstrap.php",
  ref: "dev"
}

# Push a fix directly to a branch
mcp__github__push_files {
  owner: "jazzsequence",
  repo: "jazzsequence.com",
  branch: "fix/my-branch",
  files: [{path: "...", content: "..."}],
  message: "fix: description"
}

# Create a PR
mcp__github__create_pull_request {
  owner: "jazzsequence",
  repo: "jazzsequence.com",
  title: "fix: description",
  head: "fix/my-branch",
  base: "dev"
}
```

### Repos in Scope

| Repo | Owner | Default branch | Purpose |
|------|-------|----------------|---------|
| `jazz-nextjs` | `jazzsequence` | `main` | This Next.js frontend |
| `jazzsequence.com` | `jazzsequence` | `dev` | WordPress backend |

---

## MCP vs REST API

| Need | Use |
|------|-----|
| Understand site structure | `jazzsequence-wordpress` MCP (discovery tools) |
| Verify data shapes before writing Zod schemas | `jazzsequence-wordpress` MCP (query tools) |
| Production content fetching (ISR, SSR) | WordPress REST API via `src/lib/wordpress/client.ts` |
| Create/update WordPress content | `jazzsequence-wordpress` MCP (CRUD tools) |
| GitHub operations | GitHub MCP |

**MCP informs schema; the REST API client delivers content at runtime.**
