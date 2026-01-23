#!/bin/bash
# Pre-deployment verification script for Giuliana's 40th Birthday Guestbook
# This script verifies that the application is ready for deployment to Vercel

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project root directory
PROJECT_ROOT="/Users/pierluigibaiano/Development/g_gift"

echo "${BLUE}========================================${NC}"
echo "${BLUE}  Pre-Deployment Verification Script${NC}"
echo "${BLUE}  Giuliana's 40th Birthday Guestbook${NC}"
echo "${BLUE}========================================${NC}"
echo ""

# Function to print success message
print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

# Function to print error message
print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Function to print info message
print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Function to print warning message
print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Change to project root
cd "$PROJECT_ROOT" || exit 1

# Counter for errors
ERRORS=0

# 1. Check Node.js and npm versions
echo ""
echo "${BLUE}[1/8] Checking Node.js and npm versions...${NC}"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    print_success "Node.js version: $NODE_VERSION"
else
    print_error "Node.js not found"
    ((ERRORS++))
fi

if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    print_success "npm version: $NPM_VERSION"
else
    print_error "npm not found"
    ((ERRORS++))
fi

# 2. Check if dependencies are installed
echo ""
echo "${BLUE}[2/8] Checking dependencies...${NC}"
if [ -d "node_modules" ]; then
    print_success "node_modules directory exists"
else
    print_error "node_modules not found. Run: npm install"
    ((ERRORS++))
fi

# 3. TypeScript type checking
echo ""
echo "${BLUE}[3/8] Running TypeScript type check...${NC}"
if npm run type-check 2>&1 | grep -q "error TS"; then
    print_error "TypeScript errors found"
    npm run type-check
    ((ERRORS++))
else
    if npm run type-check > /dev/null 2>&1; then
        print_success "TypeScript type check passed"
    else
        print_error "TypeScript type check failed"
        ((ERRORS++))
    fi
fi

# 4. Build test
echo ""
echo "${BLUE}[4/8] Testing production build...${NC}"
if npm run build > /tmp/build.log 2>&1; then
    print_success "Build completed successfully"
    
    # Check bundle size
    if [ -d ".next" ]; then
        print_info "Build output created in .next directory"
    fi
else
    print_error "Build failed. Check /tmp/build.log for details"
    cat /tmp/build.log
    ((ERRORS++))
fi

# 5. Check critical files exist
echo ""
echo "${BLUE}[5/8] Checking critical files...${NC}"

CRITICAL_FILES=(
    "src/middleware.ts"
    "src/lib/supabase/client.ts"
    "src/lib/supabase/server.ts"
    "src/app/(vip)/gallery/page.tsx"
    "src/app/(admin)/approve-users/page.tsx"
    "src/app/(admin)/approve-content/page.tsx"
    "src/app/(guest)/upload/page.tsx"
    "src/app/(auth)/login/page.tsx"
    "src/app/(auth)/register/page.tsx"
    "supabase/migrations/001_initial_schema.sql"
    "supabase/migrations/002_rls_policies.sql"
    "supabase/migrations/003_seed_data.sql"
)

for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        print_success "$file exists"
    else
        print_error "$file missing"
        ((ERRORS++))
    fi
done

# 6. Check environment variables setup
echo ""
echo "${BLUE}[6/8] Checking environment variables...${NC}"

if [ -f ".env.local" ]; then
    print_success ".env.local exists"
    
    # Check for required variables (without exposing values)
    REQUIRED_VARS=(
        "NEXT_PUBLIC_SUPABASE_URL"
        "NEXT_PUBLIC_SUPABASE_ANON_KEY"
        "SUPABASE_SERVICE_ROLE_KEY"
    )
    
    for var in "${REQUIRED_VARS[@]}"; do
        if grep -q "^$var=" .env.local; then
            print_success "$var is set in .env.local"
        else
            print_warning "$var not found in .env.local (ensure it's set in Vercel)"
        fi
    done
else
    print_warning ".env.local not found (ensure env vars are set in Vercel)"
fi

# 7. Check for hardcoded secrets or URLs
echo ""
echo "${BLUE}[7/8] Checking for hardcoded values...${NC}"

# Check for localhost references
if grep -r "localhost\|127.0.0.1" src/ --exclude-dir=node_modules 2>/dev/null | grep -v "process.env" | grep -v "\/\/" ; then
    print_warning "Found hardcoded localhost references in src/"
else
    print_success "No hardcoded localhost references found"
fi

# Check for hardcoded secrets
if grep -r "sk_\|secret_\|password.*=.*['\"]" src/ --exclude-dir=node_modules 2>/dev/null | grep -v "process.env" | grep -v "\/\/" | grep -v "password" | grep -v "PasswordInput"; then
    print_error "Potential hardcoded secrets found in src/"
    ((ERRORS++))
else
    print_success "No hardcoded secrets detected"
fi

# 8. Check Git status
echo ""
echo "${BLUE}[8/8] Checking Git status...${NC}"

if command -v git &> /dev/null; then
    # Check if git repo
    if git rev-parse --git-dir > /dev/null 2>&1; then
        print_success "Git repository detected"
        
        # Check branch
        CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
        print_info "Current branch: $CURRENT_BRANCH"
        
        # Check for uncommitted changes
        if [ -n "$(git status --porcelain)" ]; then
            print_warning "There are uncommitted changes"
            git status --short
        else
            print_success "Working tree is clean"
        fi
        
        # Check if .env.local is in .gitignore
        if grep -q "\.env.*\.local\|\.env\.local" .gitignore; then
            print_success ".env.local is in .gitignore"
        else
            print_error ".env.local should be in .gitignore"
            ((ERRORS++))
        fi
    else
        print_warning "Not a git repository"
    fi
else
    print_warning "Git not found"
fi

# Summary
echo ""
echo "${BLUE}========================================${NC}"
echo "${BLUE}  Pre-Deployment Check Summary${NC}"
echo "${BLUE}========================================${NC}"
echo ""

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo ""
    echo "Your application is ready for deployment."
    echo ""
    echo "Next steps:"
    echo "1. Review DEPLOYMENT_CHECKLIST.md"
    echo "2. Ensure Supabase database is set up"
    echo "3. Configure environment variables in Vercel"
    echo "4. Push to main branch: git push origin main"
    echo ""
    exit 0
else
    echo -e "${RED}✗ Found $ERRORS error(s)${NC}"
    echo ""
    echo "Please fix the errors above before deploying."
    echo ""
    exit 1
fi
