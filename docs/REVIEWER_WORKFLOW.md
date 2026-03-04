# Reviewer Agent Workflow

## Overview

Every commit requires reviewer agent approval to ensure code quality and compliance with project standards. The pre-commit hook enforces this automatically.

## Pre-Commit Requirements (Enforced by Hook)

Before ANY commit is allowed, all of these checks must pass:

### 1. Unit Tests
```bash
npm test -- --run
```
**Why:** Validates individual components and functions work correctly in isolation.

### 2. Linter
```bash
npm run lint
```
**Why:** Enforces code style, catches potential bugs, ensures TypeScript types are correct.

### 3. Build Validation
```bash
npm run build
```
**Why:** Ensures production build succeeds, catches build-time errors.

### 4. **E2E Tests (CRITICAL)**
```bash
npm run test:e2e
```
**Why:** Catches runtime errors that unit tests miss:
- Next.js routing conflicts (different dynamic segment names)
- Server startup failures
- Integration issues between components
- Cache invalidation bugs
- Production-mode behavior

**Real example:** The routing conflict bug passed:
- ✅ Unit tests (271/271 passing)
- ✅ Linter (0 errors)
- ✅ Build (successful)
- ❌ **E2E tests would have caught:** Server crashed on startup with "different slug names" error

### 5. Reviewer Agent Approval
Spawn reviewer agent to validate changes comply with behavioral requirements.

## Summary

**Before every commit:**
1. ✅ Unit tests must pass
2. ✅ Linter must pass
3. ✅ Build must succeed
4. ✅ **E2E tests must pass** ← Critical for catching runtime errors
5. ✅ Reviewer agent must approve

**The pre-commit hook enforces all of these automatically.**

No more production bugs from routing conflicts, server crashes, or integration failures.
