#!/bin/bash
# TDD Compliance Validation Script
# Must pass before any git push

set -e

echo "🔍 TDD Compliance Validation"
echo "=============================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

FAILED=0

# Check 1: Tests exist for all source files
echo "1️⃣  Checking test coverage..."
for src_file in $(find src -name "*.ts" -o -name "*.tsx" | grep -v ".test." | grep -v ".spec."); do
    # Get relative path
    rel_path=${src_file#src/}
    # Expected test path
    test_path="tests/${rel_path%.ts*}.test.ts"
    test_path_tsx="tests/${rel_path%.tsx}.test.tsx"

    if [[ ! -f "$test_path" && ! -f "$test_path_tsx" ]]; then
        echo -e "${RED}❌ FAIL: No test found for $src_file${NC}"
        echo "   Expected: $test_path or $test_path_tsx"
        FAILED=1
    fi
done

if [[ $FAILED -eq 0 ]]; then
    echo -e "${GREEN}✅ All source files have corresponding tests${NC}"
fi
echo ""

# Check 2: Run all tests
echo "2️⃣  Running unit tests..."
if npm test -- --run > /dev/null 2>&1; then
    TEST_COUNT=$(npm test -- --run 2>&1 | grep "Tests" | grep -o '[0-9]* passed' | grep -o '[0-9]*')
    echo -e "${GREEN}✅ All tests pass ($TEST_COUNT tests)${NC}"
else
    echo -e "${RED}❌ FAIL: Tests failing${NC}"
    FAILED=1
fi
echo ""

# Check 3: Lint clean
echo "3️⃣  Running linter..."
if npm run lint > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Lint clean${NC}"
else
    echo -e "${RED}❌ FAIL: Lint errors found${NC}"
    FAILED=1
fi
echo ""

# Check 4: Build successful
echo "4️⃣  Running build..."
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ FAIL: Build errors${NC}"
    FAILED=1
fi
echo ""

# Check 5: No secrets in staged files
echo "5️⃣  Checking for secrets..."
SECRETS_FOUND=0
for file in $(git diff --cached --name-only); do
    if [[ "$file" == ".env" ]] || [[ "$file" == *".env."* ]] || [[ "$file" == *"secret"* ]]; then
        echo -e "${RED}❌ FAIL: Attempting to commit secret file: $file${NC}"
        SECRETS_FOUND=1
        FAILED=1
    fi
done

if [[ $SECRETS_FOUND -eq 0 ]]; then
    echo -e "${GREEN}✅ No secrets in commit${NC}"
fi
echo ""

# Check 6: File organization
echo "6️⃣  Checking file organization..."
WRONG_LOCATION=0
for file in $(git diff --cached --name-only | grep -E "\.(ts|tsx)$"); do
    if [[ "$file" == *.test.* ]] || [[ "$file" == *.spec.* ]]; then
        # Test files must be in /tests
        if [[ ! "$file" == tests/* ]]; then
            echo -e "${RED}❌ FAIL: Test file in wrong location: $file${NC}"
            echo "   Tests must be in /tests directory"
            WRONG_LOCATION=1
            FAILED=1
        fi
    elif [[ "$file" == src/* ]]; then
        # Source files should not be test files
        if [[ "$file" == *.test.* ]] || [[ "$file" == *.spec.* ]]; then
            echo -e "${RED}❌ FAIL: Test file in /src: $file${NC}"
            echo "   Tests must be in /tests directory"
            WRONG_LOCATION=1
            FAILED=1
        fi
    fi
done

if [[ $WRONG_LOCATION -eq 0 ]]; then
    echo -e "${GREEN}✅ File organization correct${NC}"
fi
echo ""

# Final result
echo "=============================="
if [[ $FAILED -eq 0 ]]; then
    echo -e "${GREEN}✅ TDD COMPLIANCE: PASS${NC}"
    echo ""
    echo "Safe to push to remote."
    exit 0
else
    echo -e "${RED}❌ TDD COMPLIANCE: FAIL${NC}"
    echo ""
    echo "Fix violations before pushing."
    exit 1
fi
