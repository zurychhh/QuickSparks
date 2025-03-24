#!/bin/bash

# This script starts all services in development mode
# Usage: ./scripts/dev.sh [service-name]

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo -e "${RED}Error: pnpm is not installed${NC}"
    echo "Install pnpm with: npm install -g pnpm"
    exit 1
fi

# Determine which services to start
if [ $# -eq 0 ]; then
    # No arguments provided, start all services
    echo -e "${BLUE}Starting all services in development mode...${NC}"
    pnpm dev
elif [ "$1" = "gateway" ]; then
    # Start gateway only
    echo -e "${BLUE}Starting API gateway in development mode...${NC}"
    pnpm --filter @conversion-microservices/gateway dev
elif [ "$1" = "ui" ]; then
    # Start Storybook
    echo -e "${BLUE}Starting UI components Storybook...${NC}"
    pnpm storybook
else
    # Start specific service
    echo -e "${BLUE}Starting ${1} service in development mode...${NC}"
    pnpm --filter @conversion-microservices/${1} dev
fi

# Check for errors
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to start services${NC}"
    
    # Provide additional help
    if [ $# -eq 1 ]; then
        echo -e "${YELLOW}Service '${1}' might not exist or has errors${NC}"
        echo "Available services:"
        
        # List available services
        for dir in services/*/ packages/*/; do
            if [ -f "${dir}package.json" ]; then
                SERVICE_NAME=$(basename "${dir}")
                echo "- ${SERVICE_NAME}"
            fi
        done
        
        if [ -f "gateway/package.json" ]; then
            echo "- gateway"
        fi
        
        echo -e "\nUsage examples:"
        echo "./scripts/dev.sh          # Start all services"
        echo "./scripts/dev.sh gateway  # Start gateway only"
        echo "./scripts/dev.sh pdf-service  # Start PDF service only"
    fi
    
    exit 1
fi