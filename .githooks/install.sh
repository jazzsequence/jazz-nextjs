#!/bin/bash
# Install enforcement git hooks.
#
# Safe to re-run. Use this after pulling changes that touch .githooks/ — the
# installed hook is a COPY in .git/hooks/, so edits to .githooks/pre-commit have
# no effect until it is re-run. A silently stale installed hook is the failure
# mode this guards against.

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
cd "$REPO_ROOT"

echo "Installing enforcement hooks..."

# The hook sources this at runtime rather than inlining it, so that the git hook
# and the gitignored PreToolUse handler run the same validation code. Missing lib
# means the hook blocks every commit, so fail loudly here instead.
if [ ! -f .githooks/lib/approval.sh ]; then
    echo -e "${RED}❌ .githooks/lib/approval.sh is missing${NC}"
    echo "   The pre-commit hook sources it and will block all commits without it."
    exit 1
fi

if ! bash -n .githooks/pre-commit || ! bash -n .githooks/lib/approval.sh; then
    echo -e "${RED}❌ Syntax error in hook sources — not installing${NC}"
    exit 1
fi

cp .githooks/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
chmod +x .githooks/lib/approval.sh

# Prove the copy matches, rather than assuming cp worked. An installed hook that
# has drifted from the tracked one is invisible until it misbehaves.
if ! diff -q .githooks/pre-commit .git/hooks/pre-commit > /dev/null; then
    echo -e "${RED}❌ Installed hook differs from .githooks/pre-commit${NC}"
    exit 1
fi

APPROVAL_VERSION=$(bash .githooks/lib/approval.sh version 2>/dev/null || echo "unknown")

echo -e "${GREEN}✅ Pre-commit hook installed${NC} (approval format v${APPROVAL_VERSION})"
echo ""
echo "The hook will now:"
echo "  1. Require reviewer agent approval for AI-generated changes"
echo "  2. Verify the approval was issued for the exact staged content"
echo "  3. Block commits with secrets or credentials"
echo "  4. Validate approval is fresh (<5 minutes old)"
echo ""
echo -e "${YELLOW}Approval format v2 binds an approval to a fingerprint of the git index.${NC}"
echo "Restaging after a review invalidates the approval, because the reviewer"
echo "approved content that is no longer what you are committing. Re-run the"
echo "reviewer rather than looking for a way around it."
echo ""
echo "For your own manual changes:"
echo "  USER_COMMIT=1 git commit -m \"message\""
echo ""
echo "To completely bypass (NOT RECOMMENDED):"
echo "  git commit --no-verify"
