# AI Usage Documentation

This document tracks how AI tools are used in this project, specifically Claude Code and Claude Flow.

## Tools Used

### Claude Code
- **Purpose**: Primary development assistant for code generation, refactoring, and problem-solving
- **Model**: Claude Sonnet 4.6 (primary)
- **Usage**: Interactive development, code reviews, documentation updates
- **Co-authoring**: Commits are co-authored with `Claude <claude@anthropic.com>`

### Claude Flow V3
- **Purpose**: Multi-agent orchestration and workflow automation
- **Version**: V3 with hierarchical-mesh topology
- **Configuration**:
  - Max Agents: 15
  - Memory: Hybrid (AgentDB with HNSW indexing)
  - Neural: Enabled
  - Consensus: Raft for hive-mind coordination

## Claude Flow Usage Patterns

### When Claude Flow Is Used

1. **Complex Multi-File Refactoring**
   - Spawning specialized agents for parallel file processing
   - Using hierarchical coordination for dependency management

2. **Large-Scale Testing**
   - Test runner agents for parallel test execution
   - Code review agents for automated quality checks

3. **Research & Analysis**
   - Explorer agents for codebase analysis
   - Researcher agents for documentation and API exploration

4. **GitHub Operations**
   - PR management with specialized review agents
   - Issue tracking and project coordination

### Agent Types Used

- `coder`: Implementation and code generation
- `reviewer`: Code quality and best practices validation
- `tester`: Test execution and coverage analysis
- `researcher`: Documentation and API research
- `security-architect`: Security analysis and vulnerability scanning

## Workflow Integration

### Development Cycle
1. Claude Code handles direct code changes and incremental development
2. Claude Flow orchestrates complex multi-step operations
3. All changes are committed incrementally with proper co-authoring
4. Documentation is updated alongside code changes
5. GitHub Actions automatically test deployments on Pantheon environments

### Memory & Learning
- AgentDB stores patterns and solutions across sessions
- HNSW indexing enables fast semantic search
- Neural compression optimizes memory usage
- Session restoration preserves context between work sessions

## Development Methodology

### Test-Driven Development (TDD London School)

This project follows **TDD London School** (mockist approach):

1. **Write Tests First**: Always write tests before implementing functionality
2. **Red-Green-Refactor**:
   - Red: Write failing test
   - Green: Write minimal code to pass
   - Refactor: Improve code while keeping tests green
3. **Mock-First**: Use mocks for external dependencies (API calls, database)
4. **Never Commit Failing Tests**: All tests must pass before commit

### Pre-Commit Checklist

**MANDATORY** before every commit:
```bash
npm test            # All unit tests must pass
npm run lint        # No linting errors
npm run build       # Build must succeed
npm run test:e2e    # All E2E tests must pass
```

After all checks pass, obtain **reviewer agent approval** before committing.

If any command fails, fix the issues before committing. Never:
- Disable/whitelist linting rules to bypass errors
- Comment out failing tests
- Commit with build failures
- Skip running tests

### Dependency Management

**Rule**: Keep all dependencies up to date and compatible

**Node.js Version**: 24.13.0 (matches Pantheon deployment environment)
- Managed via nvm with `.nvmrc` file
- npm 11.11.0
- Ensures package-lock.json compatibility across local and CI/CD

Recent dependency decisions:
- **Node.js**: Upgraded to 24.13.0 to match Pantheon (from 22.6.0)
- **Next.js**: Upgraded to 16.2.2 with Turbopack build (from 15.5.7)
- **React**: Upgraded to 19.2.4 (from 18.3.1)
- **Pantheon Cache Handler**: Upgraded to 0.6.0; `proxy.ts` and postinstall patch removed — handler manages edge cache clearing internally
- **ESLint**: Migrated to `eslint-config-next@16.2.2` with native flat config (no FlatCompat wrapper); ESLint 9.x (10.x not yet supported by `eslint-plugin-react`)
- **Tailwind CSS**: Upgraded to v4.2 — config moved from `tailwind.config.js` to `@theme` block in `app/globals.css`; PostCSS plugin is now `@tailwindcss/postcss`
- **Test Environment**: Switched from jsdom to happy-dom for better ESM compatibility and performance
- **isomorphic-dompurify**: Removed — replaced with `sanitize-html` (PostContent server-side), `dompurify` (GreetingClient client-side), and `stripHtml()` utility (PostCard, SearchResults plain-text excerpts)
- **Zod**: Upgraded to v4 — `ZodError.errors` → `.issues`; `z.record()` requires explicit key schema; `.passthrough()` inference includes index signature
- **TypeScript**: Upgraded to v6 — Use `unknown` instead of `any` for type safety
- **Package Type**: Set to `"module"` for ESM support

When dependencies are updated:
1. Use Node 24.13.0 via `nvm use 24.13.0`
2. Update package.json and package-lock.json
3. Update README.md dependency versions
4. Update this file (AI_USAGE.md)
5. Test thoroughly before committing
6. Document breaking changes in commit message

## Best Practices

1. **Test-First Development**: Write tests before implementation code
2. **Test Standalone Builds**: Use `npm run start:test` to verify production behavior before deploying
3. **Single Message Operations**: All related operations in one message for parallelization
4. **Background Execution**: Long-running tasks use `run_in_background: true`
5. **No Polling**: Trust agents to return results rather than checking status
6. **Incremental Commits**: Small, focused commits with clear messages
7. **Never Skip Quality Checks**: Always run test, lint, and build before commit
8. **Error Handling**: Use `error.name` instead of `instanceof` for production compatibility

## Session Management

- Sessions are saved and can be restored via `session-{timestamp}` IDs
- Auto memory files persist learnings across conversations
- Hooks integrate with git workflow for automated quality checks

## Testing Standards

See [TESTING.md](TESTING.md) for complete testing guide.

**Quick reference**:
- Test framework: Vitest 4.0.18 with happy-dom
- E2E testing: Playwright 1.58.2
- API mocking: MSW 2.12.10
- Always write tests before implementation (TDD)
- All tests must pass before commit
- Test standalone builds with `npm run start:test` before deploying
- Use `error.name` checks instead of `instanceof` for production compatibility

### Automated Testing on Pantheon

GitHub Actions workflow (`.github/workflows/test-pantheon.yml`) runs tests against deployed Pantheon environments:
- **On push to main**: Tests run against `dev-jazz-nextjs15.pantheonsite.io`
- **On pull requests**: Tests run against `pr-{number}-jazz-nextjs15.pantheonsite.io`
- **Wait strategy**: HTTP polling (30 attempts × 20s) to wait for Pantheon deployment
- **Cache clearing**: Automatically clears Pantheon CDN cache after deployment via Terminus
- **Test types**: Unit tests (`npm test`) and E2E tests (`npm run test:e2e`)
- **Environment detection**: Playwright uses `BASE_URL` env var to target remote Pantheon sites

**Required GitHub Secret**: `PANTHEON_MACHINE_TOKEN` for Terminus authentication

## Last Updated
2026-04-03
