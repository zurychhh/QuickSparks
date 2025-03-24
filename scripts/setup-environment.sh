#!/bin/bash

# This script sets up the development environment for new contributors
# Usage: ./scripts/setup-environment.sh

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Setting up development environment for QuickSparks Conversion Microservices...${NC}"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    echo "Please install Node.js 16.x or higher: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2)
NODE_MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1)

if [ $NODE_MAJOR_VERSION -lt 16 ]; then
    echo -e "${RED}Error: Node.js version 16.x or higher is required${NC}"
    echo "Current version: $NODE_VERSION"
    echo "Please upgrade Node.js: https://nodejs.org/"
    exit 1
fi

echo -e "✅ ${GREEN}Node.js ${NODE_VERSION} is installed${NC}"

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo -e "${YELLOW}pnpm is not installed. Installing...${NC}"
    npm install -g pnpm
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}Error: Failed to install pnpm${NC}"
        exit 1
    fi
fi

# Check pnpm version
PNPM_VERSION=$(pnpm -v)
PNPM_MAJOR_VERSION=$(echo $PNPM_VERSION | cut -d'.' -f1)

if [ $PNPM_MAJOR_VERSION -lt 8 ]; then
    echo -e "${YELLOW}pnpm version 8.x or higher is recommended. Upgrading...${NC}"
    npm install -g pnpm@latest
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}Error: Failed to upgrade pnpm${NC}"
        exit 1
    fi
    
    PNPM_VERSION=$(pnpm -v)
fi

echo -e "✅ ${GREEN}pnpm ${PNPM_VERSION} is installed${NC}"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}Warning: Docker is not installed${NC}"
    echo "Docker is recommended for running the services in containers"
    echo "Please install Docker: https://docs.docker.com/get-docker/"
else
    echo -e "✅ ${GREEN}Docker is installed${NC}"
    
    # Check if Docker is running
    if ! docker info &> /dev/null; then
        echo -e "${YELLOW}Warning: Docker is not running${NC}"
        echo "Please start Docker to use containerized services"
    fi
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}Warning: Docker Compose is not installed${NC}"
    echo "Docker Compose is used for running multi-container services"
    echo "Please install Docker Compose: https://docs.docker.com/compose/install/"
else
    echo -e "✅ ${GREEN}Docker Compose is installed${NC}"
fi

# Install project dependencies
echo -e "\n${BLUE}Installing project dependencies...${NC}"
pnpm install

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to install dependencies${NC}"
    exit 1
fi

echo -e "✅ ${GREEN}Dependencies installed successfully${NC}"

# Setup git hooks
echo -e "\n${BLUE}Setting up git hooks...${NC}"
pnpm run prepare

if [ $? -ne 0 ]; then
    echo -e "${YELLOW}Warning: Failed to set up git hooks${NC}"
    echo "You may need to run 'pnpm run prepare' manually"
else
    echo -e "✅ ${GREEN}Git hooks set up successfully${NC}"
fi

# Create local environment file if it doesn't exist
if [ ! -f ".env" ]; then
    echo -e "\n${BLUE}Creating local environment file...${NC}"
    cp .env.example .env 2>/dev/null || echo "NODE_ENV=development" > .env
    echo -e "✅ ${GREEN}Created .env file${NC}"
    echo -e "${YELLOW}Note: You may need to update values in the .env file${NC}"
fi

# Check for required environment variables
echo -e "\n${BLUE}Checking environment variables...${NC}"
if [ -f ".env" ]; then
    missing_vars=0
    required_vars=("NODE_ENV" "PORT")
    
    for var in "${required_vars[@]}"; do
        if ! grep -q "^${var}=" .env; then
            echo -e "${YELLOW}Warning: Missing required environment variable: ${var}${NC}"
            missing_vars=$((missing_vars + 1))
        fi
    done
    
    if [ $missing_vars -gt 0 ]; then
        echo -e "${YELLOW}Please update your .env file with the missing variables${NC}"
    else
        echo -e "✅ ${GREEN}All required environment variables are set${NC}"
    fi
else
    echo -e "${YELLOW}Warning: No .env file found${NC}"
fi

# Final instructions
echo -e "\n${GREEN}Setup completed!${NC}"
echo -e "${BLUE}To start the development environment:${NC}"
echo "  pnpm dev          # Start all services"
echo "  pnpm test         # Run tests"
echo -e "\n${BLUE}Project structure:${NC}"
echo "  /services         # Microservices"
echo "  /packages         # Shared packages"
echo "  /gateway          # API gateway"
echo "  /docs             # Documentation"
echo -e "\n${BLUE}For more information, check the README.md and docs directory${NC}"