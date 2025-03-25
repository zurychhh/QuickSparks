#!/bin/bash

# Script to run all conversion service tests

# Set base directory
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEST_DIR="$BASE_DIR/tests"
FIXTURES_DIR="$TEST_DIR/fixtures"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}  PDF ↔ DOCX Conversion Service Tests  ${NC}"
echo -e "${YELLOW}========================================${NC}"

# Step 1: Generate test fixtures
echo -e "\n${GREEN}Step 1: Generating test fixtures...${NC}"
if node "$FIXTURES_DIR/generate-test-files.js"; then
  echo -e "${GREEN}✓ Test fixtures generated successfully${NC}"
else
  echo -e "${RED}✗ Failed to generate test fixtures${NC}"
  exit 1
fi

# Step 2: Run the tests
echo -e "\n${GREEN}Step 2: Running all tests...${NC}"
cd "$BASE_DIR"

# Run Jest tests using the JavaScript test files (not TypeScript)
if npx jest --config=jest.config.js tests/**/*.test.js; then
  echo -e "${GREEN}✓ All tests completed successfully${NC}"
else
  echo -e "${RED}✗ Some tests failed${NC}"
  exit 1
fi

echo -e "\n${YELLOW}========================================${NC}"
echo -e "${GREEN}  All tests completed                 ${NC}"
echo -e "${YELLOW}========================================${NC}"

exit 0