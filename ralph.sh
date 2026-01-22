#!/bin/bash
# Ralph Loop - Main script for autonomous development
# Usage: ./ralph.sh [max-iterations]

set -e

# Configuration
INSTRUCTIONS_FILE="ralph-instructions.txt"
MAX_ITERATIONS=${1:-50}
COMPLETION_PROMISE="GUESTBOOK_COMPLETE"
LOG_FILE="ralph-$(date +%Y%m%d-%H%M%S).log"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🎂 Starting Ralph Loop for Giuliana's Guestbook${NC}"
echo -e "${YELLOW}Max iterations: ${MAX_ITERATIONS}${NC}"
echo -e "${YELLOW}Completion promise: ${COMPLETION_PROMISE}${NC}"
echo -e "${YELLOW}Log file: ${LOG_FILE}${NC}"
echo ""

# Check if instructions file exists
if [ ! -f "$INSTRUCTIONS_FILE" ]; then
    echo -e "${RED}Error: ${INSTRUCTIONS_FILE} not found${NC}"
    exit 1
fi

# Check if Claude Code is available
if ! command -v claude &> /dev/null; then
    echo -e "${RED}Error: Claude Code CLI not found. Please install it first.${NC}"
    exit 1
fi

# Start the Ralph loop
echo -e "${GREEN}Starting autonomous development loop...${NC}"
echo "Instructions: $(cat $INSTRUCTIONS_FILE | head -n 3)"
echo ""

# Use Claude Code's built-in ralph-loop command
claude /ralph-loop "$(cat $INSTRUCTIONS_FILE)" \
    --max-iterations "$MAX_ITERATIONS" \
    --completion-promise "$COMPLETION_PROMISE" \
    2>&1 | tee "$LOG_FILE"

# Check exit status
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Ralph loop completed successfully!${NC}"
    echo -e "${GREEN}Check ${LOG_FILE} for full details${NC}"
else
    echo -e "${RED}✗ Ralph loop exited with errors${NC}"
    echo -e "${YELLOW}Check ${LOG_FILE} for details${NC}"
    exit 1
fi
