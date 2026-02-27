# AI Usage Documentation

This document tracks how AI tools are used in this project, specifically Claude Code and Claude Flow.

## Tools Used

### Claude Code
- **Purpose**: Primary development assistant for code generation, refactoring, and problem-solving
- **Model**: Claude Sonnet 4.5 (primary), with Opus 4.6 available for complex tasks
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

### Memory & Learning
- AgentDB stores patterns and solutions across sessions
- HNSW indexing enables fast semantic search
- Neural compression optimizes memory usage
- Session restoration preserves context between work sessions

## Best Practices

1. **Single Message Operations**: All related operations in one message for parallelization
2. **Background Execution**: Long-running tasks use `run_in_background: true`
3. **No Polling**: Trust agents to return results rather than checking status
4. **Incremental Commits**: Small, focused commits with clear messages

## Session Management

- Sessions are saved and can be restored via `session-{timestamp}` IDs
- Auto memory files persist learnings across conversations
- Hooks integrate with git workflow for automated quality checks

## Last Updated
2026-02-26
