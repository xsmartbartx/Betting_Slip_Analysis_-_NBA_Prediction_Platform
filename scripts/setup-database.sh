#!/bin/bash

# Database Setup Script for Betting App
# This script helps set up PostgreSQL database for the application

set -e

echo "=========================================="
echo "Betting App - Database Setup"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo -e "${RED}Error: PostgreSQL is not installed${NC}"
    echo "Please install PostgreSQL first:"
    echo "  macOS: brew install postgresql"
    echo "  Ubuntu: sudo apt-get install postgresql"
    echo "  Windows: Download from https://www.postgresql.org/download/"
    exit 1
fi

echo -e "${GREEN}✓ PostgreSQL is installed${NC}"

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
    echo -e "${GREEN}✓ Environment variables loaded from .env${NC}"
else
    echo -e "${YELLOW}Warning: .env file not found. Using defaults.${NC}"
    export DATABASE_NAME=${DATABASE_NAME:-betting_app}
    export DATABASE_USER=${DATABASE_USER:-postgres}
    export DATABASE_PASSWORD=${DATABASE_PASSWORD:-postgres}
    export DATABASE_HOST=${DATABASE_HOST:-localhost}
    export DATABASE_PORT=${DATABASE_PORT:-5432}
fi

# Prompt for database credentials if not set
if [ -z "$DATABASE_USER" ]; then
    read -p "Enter PostgreSQL username [postgres]: " DATABASE_USER
    DATABASE_USER=${DATABASE_USER:-postgres}
fi

if [ -z "$DATABASE_NAME" ]; then
    read -p "Enter database name [betting_app]: " DATABASE_NAME
    DATABASE_NAME=${DATABASE_NAME:-betting_app}
fi

echo ""
echo "Database Configuration:"
echo "  Host: ${DATABASE_HOST:-localhost}"
echo "  Port: ${DATABASE_PORT:-5432}"
echo "  Database: $DATABASE_NAME"
echo "  User: $DATABASE_USER"
echo ""

# Test PostgreSQL connection
echo "Testing PostgreSQL connection..."
export PGPASSWORD=$DATABASE_PASSWORD

if psql -h ${DATABASE_HOST:-localhost} -p ${DATABASE_PORT:-5432} -U $DATABASE_USER -d postgres -c '\q' 2>/dev/null; then
    echo -e "${GREEN}✓ PostgreSQL connection successful${NC}"
else
    echo -e "${RED}Error: Cannot connect to PostgreSQL${NC}"
    echo "Please check your PostgreSQL installation and credentials"
    exit 1
fi

# Create database if it doesn't exist
echo ""
echo "Creating database '$DATABASE_NAME' if it doesn't exist..."
if psql -h ${DATABASE_HOST:-localhost} -p ${DATABASE_PORT:-5432} -U $DATABASE_USER -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = '$DATABASE_NAME'" | grep -q 1; then
    echo -e "${YELLOW}Database '$DATABASE_NAME' already exists${NC}"
else
    psql -h ${DATABASE_HOST:-localhost} -p ${DATABASE_PORT:-5432} -U $DATABASE_USER -d postgres -c "CREATE DATABASE $DATABASE_NAME"
    echo -e "${GREEN}✓ Database '$DATABASE_NAME' created${NC}"
fi

# Run database initialization
echo ""
echo "Running database initialization..."
cd backend
npm run db:init

# Seed initial data
echo ""
read -p "Do you want to seed initial data (NBA teams, bookmakers)? [y/N]: " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Seeding database..."
    npm run db:seed
    echo -e "${GREEN}✓ Database seeded successfully${NC}"
fi

echo ""
echo -e "${GREEN}=========================================="
echo "Database setup completed successfully!"
echo "==========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Update your .env file with the correct database credentials"
echo "2. Run 'npm run db:validate' to verify the configuration"
echo "3. Start the backend server with 'npm run dev'"
