#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 WordWise Database Migration Script${NC}"
echo -e "${BLUE}======================================${NC}\n"

# Load environment variables
if [ -f .env.local ]; then
    export $(grep -v '^#' .env.local | xargs)
else
    echo -e "${RED}❌ .env.local file not found${NC}"
    exit 1
fi

# Extract project reference from Supabase URL
PROJECT_REF=$(echo $NEXT_PUBLIC_SUPABASE_URL | sed 's/https:\/\/\([^.]*\).*/\1/')
echo -e "${BLUE}📡 Project Reference: ${PROJECT_REF}${NC}"

# Ask for database password
echo -e "${YELLOW}🔐 Please enter your Supabase database password:${NC}"
echo -e "${YELLOW}   (You can find this in your Supabase Dashboard > Settings > Database)${NC}"
read -s DB_PASSWORD

# Database connection string
DB_URL="postgresql://postgres:${DB_PASSWORD}@db.${PROJECT_REF}.supabase.co:5432/postgres"

echo -e "\n${BLUE}🔍 Testing database connection...${NC}"
if ! psql "$DB_URL" -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${RED}❌ Failed to connect to database. Please check your password.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Database connection successful${NC}\n"

# Find migration files
MIGRATIONS_DIR="database/migrations"
if [ ! -d "$MIGRATIONS_DIR" ]; then
    echo -e "${RED}❌ Migrations directory not found: $MIGRATIONS_DIR${NC}"
    exit 1
fi

# Get sorted list of migration files
MIGRATION_FILES=($(ls $MIGRATIONS_DIR/*.sql 2>/dev/null | sort))

if [ ${#MIGRATION_FILES[@]} -eq 0 ]; then
    echo -e "${YELLOW}⚠️  No migration files found in $MIGRATIONS_DIR${NC}"
    exit 0
fi

echo -e "${BLUE}📋 Found ${#MIGRATION_FILES[@]} migration files:${NC}"
for file in "${MIGRATION_FILES[@]}"; do
    echo -e "   - $(basename $file)"
done

echo -e "\n${YELLOW}🤔 Do you want to run all migrations? (y/N):${NC}"
read -r CONFIRM

if [[ ! $CONFIRM =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}⏹️  Migration cancelled${NC}"
    exit 0
fi

echo -e "\n${BLUE}🔄 Running migrations...${NC}\n"

# Run each migration
SUCCESS_COUNT=0
for migration_file in "${MIGRATION_FILES[@]}"; do
    filename=$(basename "$migration_file")
    echo -e "${BLUE}📝 Running: $filename${NC}"
    
    if psql "$DB_URL" -f "$migration_file" -q; then
        echo -e "${GREEN}✅ Success: $filename${NC}"
        ((SUCCESS_COUNT++))
    else
        echo -e "${RED}❌ Failed: $filename${NC}"
        echo -e "${RED}💥 Migration stopped due to error${NC}"
        exit 1
    fi
    
    # Small delay between migrations
    sleep 1
done

echo -e "\n${GREEN}🎉 All migrations completed successfully!${NC}"
echo -e "${GREEN}📊 Ran $SUCCESS_COUNT out of ${#MIGRATION_FILES[@]} migrations${NC}\n"

# Test the new tables
echo -e "${BLUE}🧪 Testing created tables...${NC}"
psql "$DB_URL" -c "
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname NOT IN ('information_schema', 'pg_catalog')
ORDER BY schemaname, tablename;
" -t

echo -e "\n${GREEN}✨ Database setup complete! Your admin APIs should now work.${NC}" 