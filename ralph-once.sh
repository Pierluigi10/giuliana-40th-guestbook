#!/bin/bash
# Ralph Once - Single iteration for testing
# Usage: ./ralph-once.sh

set -e

INSTRUCTIONS_FILE="ralph-instructions.txt"
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🧪 Ralph Single Iteration Test${NC}"
echo ""

# Check if instructions file exists
if [ ! -f "$INSTRUCTIONS_FILE" ]; then
    echo -e "${RED}Error: ${INSTRUCTIONS_FILE} not found${NC}"
    exit 1
fi

# Show what will be executed
echo -e "${YELLOW}Instructions:${NC}"
cat "$INSTRUCTIONS_FILE" | head -n 10
echo "..."
echo ""

# Run a single iteration with max-iterations=1
echo -e "${GREEN}Running single iteration...${NC}"
claude /ralph-loop "$(cat $INSTRUCTIONS_FILE)" \
    --max-iterations 1 \
    --completion-promise "GUESTBOOK_COMPLETE"

echo ""
echo -e "${GREEN}✓ Single iteration complete${NC}"
echo -e "${YELLOW}Review the output above to verify Ralph is working correctly${NC}"
echo -e "${YELLOW}If everything looks good, run ./ralph.sh to start the full loop${NC}"
