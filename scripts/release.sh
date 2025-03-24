#!/bin/bash

# This script automates creating a release
# Usage: ./scripts/release.sh [major|minor|patch]

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if jq is installed (used for package.json manipulation)
if ! command -v jq &> /dev/null; then
    echo -e "${RED}Error: jq is not installed${NC}"
    echo "Install jq with: brew install jq (macOS) or apt-get install jq (Linux)"
    exit 1
fi

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
if [ $# -ne 1 ]; then
    echo -e "${RED}Error: Please specify release type: major, minor, or patch${NC}"
    echo "Usage: ./scripts/release.sh [major|minor|patch]"
    exit 1
fi

RELEASE_TYPE=$1

if [ "$RELEASE_TYPE" != "major" ] && [ "$RELEASE_TYPE" != "minor" ] && [ "$RELEASE_TYPE" != "patch" ]; then
    echo -e "${RED}Error: Release type must be major, minor, or patch${NC}"
    echo "Usage: ./scripts/release.sh [major|minor|patch]"
    exit 1
fi

# Get current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

# Make sure we're on develop
if [ "$CURRENT_BRANCH" != "develop" ]; then
    echo -e "${YELLOW}Warning: You are not on the 'develop' branch.${NC}"
    read -p "Do you want to continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Operation cancelled"
        exit 0
    fi
fi

# Make sure working directory is clean
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${RED}Error: Working directory is not clean${NC}"
    echo "Please commit or stash your changes before creating a release"
    exit 1
fi

# Pull latest changes
echo "Pulling latest changes from 'develop'..."
git pull origin develop
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to pull latest changes${NC}"
    exit 1
fi

# Get current version from package.json
CURRENT_VERSION=$(jq -r '.version' package.json)
echo -e "Current version: ${BLUE}${CURRENT_VERSION}${NC}"

# Calculate new version
IFS='.' read -ra VERSION_PARTS <<< "$CURRENT_VERSION"
MAJOR=${VERSION_PARTS[0]}
MINOR=${VERSION_PARTS[1]}
PATCH=${VERSION_PARTS[2]}

if [ "$RELEASE_TYPE" == "major" ]; then
    MAJOR=$((MAJOR + 1))
    MINOR=0
    PATCH=0
elif [ "$RELEASE_TYPE" == "minor" ]; then
    MINOR=$((MINOR + 1))
    PATCH=0
elif [ "$RELEASE_TYPE" == "patch" ]; then
    PATCH=$((PATCH + 1))
fi

NEW_VERSION="${MAJOR}.${MINOR}.${PATCH}"
echo -e "New version: ${BLUE}${NEW_VERSION}${NC}"

# Confirm version
read -p "Do you want to create release ${NEW_VERSION}? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Operation cancelled"
    exit 0
fi

# Create release branch
RELEASE_BRANCH="release/v${NEW_VERSION}"
echo "Creating release branch: ${RELEASE_BRANCH}..."
git checkout -b "$RELEASE_BRANCH"
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to create release branch${NC}"
    exit 1
fi

# Update version in package.json
echo "Updating version in package.json..."
jq ".version = \"${NEW_VERSION}\"" package.json > package.json.tmp && mv package.json.tmp package.json
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to update version in package.json${NC}"
    exit 1
fi

# Update version in other relevant files if needed (e.g., package-lock.json)
if [ -f "package-lock.json" ]; then
    jq ".version = \"${NEW_VERSION}\"" package-lock.json > package-lock.json.tmp && mv package-lock.json.tmp package-lock.json
fi

# Update versions in workspace packages
echo "Checking for workspace packages..."
if [ -f "pnpm-workspace.yaml" ]; then
    WORKSPACE_PACKAGES=$(find packages services -type f -name "package.json" 2>/dev/null)
    
    if [ -n "$WORKSPACE_PACKAGES" ]; then
        echo "Updating workspace package dependencies..."
        for pkg in $WORKSPACE_PACKAGES; do
            # Update dependencies that reference the root package
            jq --arg version "$NEW_VERSION" '
                if .dependencies["@conversion-microservices/shared"] then
                    .dependencies["@conversion-microservices/shared"] = "workspace:*"
                else . end
            ' "$pkg" > "${pkg}.tmp" && mv "${pkg}.tmp" "$pkg"
        done
    fi
fi

# Create update commit
echo "Committing version update..."
git add .
git commit -m "chore: bump version to ${NEW_VERSION}"
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to commit version update${NC}"
    exit 1
fi

# Push release branch
echo "Pushing release branch..."
git push -u origin "$RELEASE_BRANCH"
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to push release branch${NC}"
    exit 1
fi

# Instructions for further steps
echo -e "\n${GREEN}Release branch '${RELEASE_BRANCH}' created and pushed!${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Create a pull request from ${RELEASE_BRANCH} to 'main'"
echo "2. After approval and merge, tag the release on 'main':"
echo "   git checkout main"
echo "   git pull"
echo "   git tag -a v${NEW_VERSION} -m \"Release v${NEW_VERSION}\""
echo "   git push origin v${NEW_VERSION}"
echo "3. Merge changes back to 'develop':"
echo "   git checkout develop"
echo "   git pull"
echo "   git merge --no-ff main"
echo "   git push origin develop"