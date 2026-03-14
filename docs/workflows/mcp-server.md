# WordPress MCP Server Workflow

**ALWAYS use the WordPress MCP server as your FIRST resource for understanding jazzsequence.com content structure, schemas, and capabilities.**

## Overview

The MCP (Model Context Protocol) server provides AI-native access to WordPress content at jazzsequence.com, enabling automatic schema discovery and content exploration beyond simple REST API calls.

## Configuration

**Endpoint**: `https://jazzsequence.com/wp-json/mcp/mcp-adapter-default-server`
**MCP Server**: `jazzsequence-wordpress` (configured in `~/.config/claude/mcp.json`)
**Proxy**: `~/.config/claude/mcp-wordpress-http-proxy.js`

## Status Check

```typescript
// Verify MCP server is connected
ListMcpResourcesTool(server="jazzsequence-wordpress")
```

## When to Use MCP Server

### ALWAYS Use For

- Discovering available custom post types
- Understanding WordPress content schemas
- Querying post metadata and custom fields
- Exploring taxonomy structures
- Checking plugin-added fields
- Understanding content relationships

### Example Queries

**Discover Custom Post Types**:
```
"What custom post types exist on jazzsequence.com?"
→ Use: mcp-adapter-discover-abilities or mcp-adapter-execute-ability
```

**Understand Schema**:
```
"What fields does the gc_game post type have?"
→ Use: mcp-adapter-get-ability-info + mcp-adapter-execute-ability
```

**Query Content**:
```
"Show me the latest 5 posts"
→ Use: mcp-adapter-execute-ability with query parameters
```

## Available MCP Tools

### Core Abilities

- `mcp-adapter-discover-abilities` - List all registered WordPress abilities
- `mcp-adapter-get-ability-info` - Get detailed ability schema
- `mcp-adapter-execute-ability` - Execute WordPress abilities with parameters

### Content Abilities

From jazzsequence-mcp-abilities plugin:
- Create/read/update/delete posts, pages, custom post types
- Query posts by criteria (post type, taxonomy, meta, date ranges)
- Manage post metadata
- Handle featured images

### Media Abilities

- Upload media files
- Query media library
- Update media metadata

### Taxonomy Abilities

- Manage categories, tags, custom taxonomies
- Query term relationships

### NinjaForms Abilities

- Create/manage forms, fields, actions, calculations
- 15+ form management tools auto-discovered

## MCP vs REST API

### Use MCP Server For

- ✅ Schema discovery and introspection
- ✅ Understanding WordPress structure
- ✅ Metadata exploration
- ✅ Content type capabilities
- ✅ CRUD operations (when needed)

### Use REST API Client For

Use `src/lib/wordpress/client.ts` for:
- ✅ Production data fetching (faster, cached)
- ✅ ISR integration with Next.js
- ✅ Bulk content queries
- ✅ Public-facing content delivery

### They Work Together

**MCP informs schema, REST API delivers content.**

## Recommended Workflow

**Correct Pattern**:
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

**WRONG Pattern**:
```typescript
// ❌ NEVER: Guess schema without checking MCP
const games = await fetchPosts('gc_game', { perPage: 10 })
// What fields exist? What metadata? ¯\_(ツ)_/¯
```

## Troubleshooting

### MCP Server Not Available

1. Check `~/.config/claude/mcp.json` exists
2. Verify proxy script: `~/.config/claude/mcp-wordpress-http-proxy.js`
3. Test manually:
   ```bash
   export WORDPRESS_MCP_ENDPOINT="https://jazzsequence.com/wp-json/mcp/mcp-adapter-default-server"
   export WORDPRESS_USERNAME="claude-mcp"
   export WORDPRESS_APP_PASSWORD="boh8dPVlGXbrSq7ENDDX4z2F"

   echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}' | \
   node ~/.config/claude/mcp-wordpress-http-proxy.js
   ```
4. Restart Claude Code

### Session Errors

If getting "Invalid or expired session" errors:
- Session timeout: 24 hours
- Max 32 sessions per user
- Restart proxy to create fresh session

## Reference

- Full setup details: `docs/SESSION_NOTES.md`
- MCP implementation: `~/.config/claude/mcp-wordpress-http-proxy.js`
- WordPress plugin: `jazzsequence-mcp-abilities` on jazzsequence.com
