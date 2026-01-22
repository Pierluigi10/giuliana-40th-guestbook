#!/bin/bash
# Ralph Regression - Run full test suite and verify all requirements
# Usage: ./ralph-regression.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 Ralph Regression Test Suite${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

FAILED=0

# Function to run a check
run_check() {
    local name=$1
    local command=$2

    echo -e "${YELLOW}Running: ${name}${NC}"
    if eval "$command"; then
        echo -e "${GREEN}✓ ${name} passed${NC}"
        echo ""
        return 0
    else
        echo -e "${RED}✗ ${name} failed${NC}"
        echo ""
        FAILED=$((FAILED + 1))
        return 1
    fi
}

# 1. Check PRD.json for all "passes": true
run_check "PRD Requirements Check" '
    TOTAL=$(jq "[.requirements[].passes] | length" specs/PRD.json)
    PASSING=$(jq "[.requirements[].passes] | map(select(. == true)) | length" specs/PRD.json)
    echo "  Requirements passing: $PASSING/$TOTAL"
    [ "$PASSING" -eq "$TOTAL" ]
'

# 2. TypeScript compilation
run_check "TypeScript Compilation" "npm run type-check"

# 3. Linting
run_check "ESLint" "npm run lint"

# 4. Unit tests
run_check "Unit Tests" "npm test"

# 5. Build
run_check "Production Build" "npm run build"

# 6. Database migrations (if applicable)
if [ -f "package.json" ] && grep -q "migrate" package.json; then
    run_check "Database Migrations" "npm run migrate"
fi

# Summary
echo -e "${BLUE}================================${NC}"
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All regression tests passed!${NC}"
    echo -e "${GREEN}The application is ready for deployment.${NC}"
    exit 0
else
    echo -e "${RED}✗ ${FAILED} regression test(s) failed${NC}"
    echo -e "${YELLOW}Fix the failing tests and run again${NC}"
    exit 1
fi
