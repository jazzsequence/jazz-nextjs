#!/bin/bash
# Install TDD enforcement git hooks

echo "Installing TDD enforcement hooks..."

# Copy hooks to .git/hooks
cp .githooks/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit

echo "✅ Pre-commit hook installed"
echo ""
echo "The hook will now:"
echo "  1. Run all tests before every commit"
echo "  2. Run linter before every commit"
echo "  3. Block commits with secrets"
echo "  4. Enforce file organization"
echo ""
echo "To bypass (NOT RECOMMENDED): git commit --no-verify"
