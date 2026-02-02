#!/bin/bash
# Automated page testing script for Arabiq platform
# Tests all pages in EN and AR for HTTP 200 responses

BASE_URL="http://localhost:3000"
TIMEOUT=10
FAILED_TESTS=()
PASSED_TESTS=()

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "Arabiq Platform - Automated Page Testing"
echo "=========================================="
echo ""

test_page() {
    local url="$1"
    local description="$2"
    
    printf "Testing: %-50s " "$description"
    
    # Use timeout and curl to test the page
    http_code=$(timeout $TIMEOUT curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$url" 2>/dev/null)
    
    if [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✓ PASS${NC} (200)"
        PASSED_TESTS+=("$description")
        return 0
    elif [ "$http_code" = "404" ]; then
        echo -e "${RED}✗ FAIL${NC} (404 Not Found)"
        FAILED_TESTS+=("$description - 404")
        return 1
    elif [ "$http_code" = "500" ]; then
        echo -e "${RED}✗ FAIL${NC} (500 Server Error)"
        FAILED_TESTS+=("$description - 500")
        return 1
    elif [ -z "$http_code" ]; then
        echo -e "${YELLOW}⚠ TIMEOUT${NC}"
        FAILED_TESTS+=("$description - Timeout")
        return 1
    else
        echo -e "${YELLOW}⚠ WARN${NC} ($http_code)"
        FAILED_TESTS+=("$description - HTTP $http_code")
        return 1
    fi
}

echo "PUBLIC PAGES"
echo "============"
echo ""

# English Pages
test_page "/en" "Homepage (EN)"
test_page "/ar" "Homepage (AR)"
test_page "/en/about" "About (EN)"
test_page "/ar/about" "About (AR)"
test_page "/en/contact" "Contact (EN)"
test_page "/ar/contact" "Contact (AR)"
test_page "/en/solutions" "Solutions List (EN)"
test_page "/ar/solutions" "Solutions List (AR)"
test_page "/en/industries" "Industries List (EN)"
test_page "/ar/industries" "Industries List (AR)"
test_page "/en/case-studies" "Case Studies List (EN)"
test_page "/ar/case-studies" "Case Studies List (AR)"
test_page "/en/demos" "Demos List (EN)"
test_page "/ar/demos" "Demos List (AR)"

echo ""
echo "AUTH PAGES"
echo "=========="
echo ""

test_page "/en/login" "Login (EN)"
test_page "/ar/login" "Login (AR)"
test_page "/en/register" "Register (EN)"
test_page "/ar/register" "Register (AR)"
test_page "/en/forgot-password" "Forgot Password (EN)"
test_page "/ar/forgot-password" "Forgot Password (AR)"
test_page "/en/registration-success" "Registration Success (EN)"
test_page "/ar/registration-success" "Registration Success (AR)"

echo ""
echo "PROTECTED PAGES (Will require auth or redirect)"
echo "================================================"
echo ""

test_page "/en/account" "Account Page (EN)"
test_page "/en/account-pending" "Account Pending (EN)"
test_page "/en/account-suspended" "Account Suspended (EN)"
test_page "/en/admin/users" "Admin Users (EN)"

echo ""
echo "ERROR PAGES"
echo "==========="
echo ""

test_page "/en/nonexistent-page-12345" "404 Page (EN)"
test_page "/ar/nonexistent-page-12345" "404 Page (AR)"

echo ""
echo "API ROUTES"
echo "=========="
echo ""

# API routes should return different status codes, just checking they respond
printf "Testing: %-50s " "API Contact (POST endpoint)"
api_code=$(timeout $TIMEOUT curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/api/contact" 2>/dev/null)
if [ "$api_code" = "405" ] || [ "$api_code" = "404" ]; then
    echo -e "${GREEN}✓ EXISTS${NC} ($api_code - needs POST)"
else
    echo -e "${YELLOW}⚠ CHECK${NC} ($api_code)"
fi

echo ""
echo "=========================================="
echo "TEST SUMMARY"
echo "=========================================="
echo ""
echo -e "${GREEN}Passed: ${#PASSED_TESTS[@]}${NC}"
echo -e "${RED}Failed: ${#FAILED_TESTS[@]}${NC}"
echo ""

if [ ${#FAILED_TESTS[@]} -gt 0 ]; then
    echo "Failed Tests:"
    for test in "${FAILED_TESTS[@]}"; do
        echo -e "  ${RED}✗${NC} $test"
    done
    echo ""
    exit 1
else
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
fi
