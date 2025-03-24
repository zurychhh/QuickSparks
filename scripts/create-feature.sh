#!/bin/bash

# This script creates a new feature branch with proper naming convention
# Usage: ./scripts/create-feature.sh feature-name "Feature description"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo -e "${RED}Error: git is not installed${NC}"
    exit 1
fi

# Check if current directory is a git repository
if ! git rev-parse --is-inside-work-tree &> /dev/null; then
    echo -e "${RED}Error: Not a git repository${NC}"
    exit 1
fi

# Validate arguments
if [ $# -lt 1 ]; then
    echo -e "${RED}Error: Feature name is required${NC}"
    echo "Usage: ./scripts/create-feature.sh feature-name \"Feature description\""
    exit 1
fi

# Format feature name: lowercase, replace spaces with hyphens
FEATURE_NAME=$(echo "$1" | tr '[:upper:]' '[:lower:]' | tr ' ' '-')
BRANCH_NAME="feature/${FEATURE_NAME}"

# Check if the branch already exists
if git show-ref --verify --quiet "refs/heads/${BRANCH_NAME}"; then
    echo -e "${RED}Error: Branch '${BRANCH_NAME}' already exists${NC}"
    exit 1
fi

# Get current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

# Make sure we're on develop
if [ "$CURRENT_BRANCH" != "develop" ]; then
    echo -e "${YELLOW}Warning: You are not on the 'develop' branch.${NC}"
    read -p "Would you like to checkout 'develop' first? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Checking out 'develop' branch..."
        git checkout develop
        if [ $? -ne 0 ]; then
            echo -e "${RED}Error: Failed to checkout 'develop' branch${NC}"
            exit 1
        fi
    fi
fi

# Pull latest changes from develop
echo "Pulling latest changes from 'develop'..."
git pull origin develop
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to pull latest changes${NC}"
    exit 1
fi

# Create and checkout new branch
echo "Creating and checking out branch '${BRANCH_NAME}'..."
git checkout -b "${BRANCH_NAME}"
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to create and checkout branch${NC}"
    exit 1
fi

# Add feature description as commit message if provided
if [ $# -gt 1 ]; then
    DESCRIPTION="$2"
    # Create empty commit with description
    git commit --allow-empty -m "feat: ${DESCRIPTION}"
    if [ $? -ne 0 ]; then
        echo -e "${RED}Error: Failed to create initial commit${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}Success: Feature branch '${BRANCH_NAME}' created${NC}"
echo "Run 'git push -u origin ${BRANCH_NAME}' to push the branch to the remote repository"
echo -e "${YELLOW}Remember to follow these steps:${NC}"
echo "1. Make your changes"
echo "2. Commit regularly with descriptive messages"
echo "3. Push your changes: git push origin ${BRANCH_NAME}"
echo "4. When ready, create a pull request to 'develop'"