#!/bin/bash
# Install enforcement git hooks

echo "Installing enforcement hooks..."

cp .githooks/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit

echo "✅ Pre-commit hook installed"
echo ""
echo "The hook will now:"
echo "  1. Require reviewer agent approval for AI-generated changes"
echo "  2. Block commits with secrets or credentials"
echo "  3. Validate approval is fresh (<5 minutes old)"
echo ""
echo "For your own manual changes:"
echo "  USER_COMMIT=1 git commit -m \"message\""
echo ""
echo "To completely bypass (NOT RECOMMENDED):"
echo "  git commit --no-verify"
