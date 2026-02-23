#!/bin/bash

# prodCo Workspace - Local Setup Script
# This script helps you set up and run prodCo Workspace locally

set -e

# Set base path
BASE_DIR="$(pwd)"

echo "--------------------------------------------------"
echo "  prodCo Workspace - Local Setup"
echo "--------------------------------------------------"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check for required commands
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}Error: $1 is not installed.${NC}"
        echo "Please install $1 and try again."
        exit 1
    fi
    echo -e "${GREEN}✓${NC} $1 found"
}

echo "Checking dependencies..."
check_command node
check_command npm
check_command psql

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}Error: Node.js 18+ is required. You have $(node -v)${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Node.js version OK ($(node -v))"

echo ""

# Check for .env file
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        echo -e "${YELLOW}No .env file found. Creating from .env.example...${NC}"
        cp .env.example .env
        echo -e "${YELLOW}Please edit .env with your configuration before continuing.${NC}"
        echo ""
        echo "Required settings:"
        echo "  - DATABASE_URL: Your PostgreSQL connection string"
        echo "  - SESSION_SECRET: A random string for session encryption"
        echo ""
        echo "Optional settings:"
        echo "  - MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET, MICROSOFT_TENANT_ID for SSO"
        echo ""
        read -p "Press Enter after editing .env to continue, or Ctrl+C to exit..."
    else
        echo -e "${RED}Error: No .env or .env.example file found.${NC}"
        exit 1
    fi
fi

# Source .env file
set -a
source .env
set +a

# Validate required environment variables
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}Error: DATABASE_URL is not set in .env${NC}"
    exit 1
fi

if [ -z "$SESSION_SECRET" ]; then
    echo -e "${RED}Error: SESSION_SECRET is not set in .env${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} Environment variables loaded"

# Test database connection
echo ""
echo "Testing database connection..."
if psql "$DATABASE_URL" -c "SELECT 1" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Database connection successful"
else
    echo -e "${RED}Error: Could not connect to database${NC}"
    echo "Please check your DATABASE_URL in .env"
    exit 1
fi

# Install dependencies
echo ""
echo "Installing dependencies..."
npm install

# Run database migrations
echo ""
echo "Running database migrations..."
npm run db:push

# Build the application
echo ""
echo "Building the application..."
npm run build

echo ""
echo "=========================================="
echo -e "${GREEN}  Setup Complete!${NC}"
echo "=========================================="
echo ""
echo "To start the application:"
echo ""
echo "  Development mode:  npm run dev"
echo "  Production mode:   npm run start"
echo ""
echo "The application will be available at http://localhost:${PORT:-5000}"
echo ""

# Ask if user wants to start now
read -p "Start the application now? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Starting in production mode..."
    npm run start
fi
