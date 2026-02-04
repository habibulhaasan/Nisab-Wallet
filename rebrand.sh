#!/bin/bash

# Nisab Wallet Rebranding Automation Script
# This script automates the rebranding from H Wallet to Nisab Wallet

set -e  # Exit on any error

echo "=========================================="
echo "Nisab Wallet Rebranding Script"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored messages
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Confirm with user
echo "This script will rebrand your application from 'H Wallet' to 'Nisab Wallet'."
echo ""
print_warning "IMPORTANT: Make sure you have a backup of your project before proceeding!"
echo ""
read -p "Do you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Rebranding cancelled."
    exit 0
fi

echo ""
echo "Starting rebranding process..."
echo ""

# Create backup
BACKUP_DIR="backup_$(date +%Y%m%d_%H%M%S)"
print_warning "Creating backup in ${BACKUP_DIR}/"
mkdir -p "$BACKUP_DIR"
cp package.json "$BACKUP_DIR/" 2>/dev/null || true
cp src/app/layout.js "$BACKUP_DIR/" 2>/dev/null || true
cp src/components/LoginForm.js "$BACKUP_DIR/" 2>/dev/null || true
cp src/app/dashboard/settings/page.js "$BACKUP_DIR/" 2>/dev/null || true
print_success "Backup created"
echo ""

# Step 1: Update package.json
echo "Step 1/5: Updating package.json..."
if [ -f "package.json" ]; then
    sed -i 's/"name": "h-wallet"/"name": "nisab-wallet"/g' package.json
    print_success "package.json updated"
else
    print_error "package.json not found!"
fi
echo ""

# Step 2: Update src/app/layout.js
echo "Step 2/5: Updating app metadata in src/app/layout.js..."
if [ -f "src/app/layout.js" ]; then
    sed -i "s/title: 'H Wallet - Zakat Tracker'/title: 'Nisab Wallet - Islamic Finance \& Zakat Tracker'/g" src/app/layout.js
    sed -i "s/description: 'Personal finance and Zakat tracking application'/description: 'Comprehensive Islamic finance management with intelligent Zakat calculation and monitoring'/g" src/app/layout.js
    print_success "src/app/layout.js updated"
else
    print_error "src/app/layout.js not found!"
fi
echo ""

# Step 3: Update src/components/LoginForm.js
echo "Step 3/5: Updating login form text..."
if [ -f "src/components/LoginForm.js" ]; then
    sed -i 's/Login to your H Wallet account/Login to your Nisab Wallet account/g' src/components/LoginForm.js
    print_success "src/components/LoginForm.js updated"
else
    print_error "src/components/LoginForm.js not found!"
fi
echo ""

# Step 4: Update settings page
echo "Step 4/5: Updating backup file naming in settings..."
if [ -f "src/app/dashboard/settings/page.js" ]; then
    sed -i 's/h-wallet-backup-/nisab-wallet-backup-/g' src/app/dashboard/settings/page.js
    print_success "src/app/dashboard/settings/page.js updated"
else
    print_error "src/app/dashboard/settings/page.js not found!"
fi

# Update backup copy if exists
if [ -f "src/app/dashboard/settings/page copy.js" ]; then
    sed -i 's/h-wallet-backup-/nisab-wallet-backup-/g' "src/app/dashboard/settings/page copy.js"
    print_success "src/app/dashboard/settings/page copy.js updated"
fi
echo ""

# Step 5: Update package-lock.json
echo "Step 5/5: Updating package-lock.json..."
if [ -f "package-lock.json" ]; then
    print_warning "Running npm install to regenerate package-lock.json..."
    npm install
    print_success "package-lock.json updated"
else
    print_warning "package-lock.json not found (might be using yarn or pnpm)"
fi
echo ""

# Verification
echo "=========================================="
echo "Verification"
echo "=========================================="
echo ""

echo "Searching for remaining 'H Wallet' references..."
remaining=$(grep -r "H Wallet" src/ 2>/dev/null | wc -l || echo "0")
if [ "$remaining" -eq 0 ]; then
    print_success "No remaining 'H Wallet' references found"
else
    print_warning "Found $remaining remaining references:"
    grep -rn "H Wallet" src/ 2>/dev/null || true
fi
echo ""

echo "Searching for remaining 'h-wallet' references..."
remaining_lower=$(grep -r "h-wallet" src/ 2>/dev/null | wc -l || echo "0")
if [ "$remaining_lower" -eq 0 ]; then
    print_success "No remaining 'h-wallet' references found"
else
    print_warning "Found $remaining_lower remaining references:"
    grep -rn "h-wallet" src/ 2>/dev/null || true
fi
echo ""

# Summary
echo "=========================================="
echo "Rebranding Complete! 🎉"
echo "=========================================="
echo ""
print_success "All files have been updated successfully!"
echo ""
echo "Next steps:"
echo "  1. Clear cache: rm -rf .next"
echo "  2. Test the app: npm run dev"
echo "  3. Check browser tab title"
echo "  4. Verify login page text"
echo "  5. Test data export filename"
echo ""
print_warning "Backup files saved in: ${BACKUP_DIR}/"
echo ""
echo "If everything works correctly, you can safely delete the backup:"
echo "  rm -rf ${BACKUP_DIR}"
echo ""
