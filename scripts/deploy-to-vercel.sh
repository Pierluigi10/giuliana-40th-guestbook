#!/bin/bash

# Deploy to Vercel Script
# This script automates the deployment process to Vercel
# Usage: ./scripts/deploy-to-vercel.sh [--prod]

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
  echo -e "${BLUE}========================================${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}========================================${NC}"
}

print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
  echo -e "${RED}✗ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠ $1${NC}"
}

# Parse arguments
PROD_FLAG=""
if [[ "$1" == "--prod" ]]; then
  PROD_FLAG="--prod"
  echo -e "${YELLOW}WARNING: Deploying to PRODUCTION!${NC}"
  echo "Press Ctrl+C to cancel, or Enter to continue..."
  read -r
fi

# Step 1: Pre-deployment checks
print_header "Pre-Deployment Verification"

# Check Node.js version
NODE_VERSION=$(node -v)
print_success "Node.js version: $NODE_VERSION"

# Check npm
NPM_VERSION=$(npm -v)
print_success "npm version: $NPM_VERSION"

# Check git status
if [[ -z $(git status -s) ]]; then
  print_success "Git working tree is clean"
else
  print_error "Git has uncommitted changes. Please commit or stash changes."
  echo "Run: git status"
  exit 1
fi

# Step 2: Build checks
print_header "Building Application"

if npm run build > /dev/null 2>&1; then
  print_success "Build successful"
else
  print_error "Build failed. Fix errors and retry."
  npm run build
  exit 1
fi

# Step 3: Type checking
print_header "Type Checking"

if npm run type-check > /dev/null 2>&1; then
  print_success "TypeScript check passed"
else
  print_error "TypeScript check failed"
  npm run type-check
  exit 1
fi

# Step 4: Linting
print_header "Linting"

if npm run lint > /dev/null 2>&1; then
  print_success "Linting passed"
else
  print_warning "Linting found issues (non-fatal)"
  # Don't exit, linting is not critical
fi

# Step 5: Check Vercel CLI
print_header "Vercel CLI Setup"

if ! command -v vercel &> /dev/null; then
  print_warning "Vercel CLI not found. Installing..."
  npm install -g vercel
  print_success "Vercel CLI installed"
else
  VERCEL_VERSION=$(vercel --version)
  print_success "Vercel CLI version: $VERCEL_VERSION"
fi

# Step 6: Verify environment variables
print_header "Environment Variables Verification"

if [[ -z "${NEXT_PUBLIC_SUPABASE_URL}" ]]; then
  print_error "NEXT_PUBLIC_SUPABASE_URL not set in local environment"
  echo "Add to .env.local or run:"
  echo "  export NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co"
  exit 1
fi
print_success "NEXT_PUBLIC_SUPABASE_URL is set"

if [[ -z "${NEXT_PUBLIC_SUPABASE_ANON_KEY}" ]]; then
  print_error "NEXT_PUBLIC_SUPABASE_ANON_KEY not set"
  echo "Add to .env.local or run:"
  echo "  export NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh..."
  exit 1
fi
print_success "NEXT_PUBLIC_SUPABASE_ANON_KEY is set"

if [[ -z "${SUPABASE_SERVICE_ROLE_KEY}" ]]; then
  print_error "SUPABASE_SERVICE_ROLE_KEY not set"
  echo "Add to .env.local or run:"
  echo "  export SUPABASE_SERVICE_ROLE_KEY=eyJh..."
  exit 1
fi
print_success "SUPABASE_SERVICE_ROLE_KEY is set"

# Step 7: Deploy
print_header "Deploying to Vercel"

echo ""
echo "Deploying with Vercel CLI..."
echo ""

if [[ -n "$PROD_FLAG" ]]; then
  vercel deploy $PROD_FLAG
  DEPLOY_URL=$(vercel --prod 2>&1 | grep -oP '✓ Production: \K.*' || echo "")
else
  vercel deploy
  DEPLOY_URL=$(vercel 2>&1 | grep -oP '✓ Preview: \K.*' || echo "")
fi

# Step 8: Post-deploy
print_header "Deployment Complete"

if [[ -n "$DEPLOY_URL" ]]; then
  print_success "Deployment URL: $DEPLOY_URL"
else
  print_warning "Could not extract deployment URL"
  echo "Check Vercel dashboard for deployment status"
fi

echo ""
print_success "Next steps:"
echo "  1. Check deployment at Vercel dashboard: https://vercel.com/dashboard"
echo "  2. Run post-deployment tests"
echo "  3. Verify all features working in production"
echo ""

print_header "Deployment Script Complete"
