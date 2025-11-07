#!/bin/bash

# 🧪 Automated API Testing Script
# Usage: ./test-api.sh

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="http://10.11.9.84:3000/api/v1"
TEST_EMAIL="tester_$(date +%s)@example.com"
TEST_PASSWORD="Test1234!"
ACCESS_TOKEN=""
ITEM_ID=""
PASSED=0
FAILED=0

echo "======================================"
echo "🧪 POSE API Testing Suite"
echo "======================================"
echo "Base URL: $BASE_URL"
echo "Test Email: $TEST_EMAIL"
echo "======================================"
echo ""

# Helper function to test API
test_api() {
    local test_name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    local expected_status=$5
    local headers=$6

    echo -n "Testing: $test_name ... "

    if [ -n "$headers" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -H "$headers" \
            -d "$data")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi

    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)

    if [ "$status_code" -eq "$expected_status" ]; then
        echo -e "${GREEN}✓ PASSED${NC} (Status: $status_code)"
        ((PASSED++))
        
        # Extract token if it's a login/register response
        if [[ "$body" == *"access_token"* ]]; then
            ACCESS_TOKEN=$(echo "$body" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
        fi
        
        # Extract item ID if it's a create item response
        if [[ "$endpoint" == "/items" && "$method" == "POST" ]]; then
            ITEM_ID=$(echo "$body" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
        fi
    else
        echo -e "${RED}✗ FAILED${NC} (Expected: $expected_status, Got: $status_code)"
        echo "Response: $body"
        ((FAILED++))
    fi
}

echo "======================================"
echo "Phase 1: Smoke Tests"
echo "======================================"

# TC-AUTH-001: Register
test_api \
    "TC-AUTH-001: User Registration" \
    "POST" \
    "/auth/register" \
    "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"name\":\"Test User\"}" \
    "201"

# TC-AUTH-005: Login
test_api \
    "TC-AUTH-005: User Login" \
    "POST" \
    "/auth/login" \
    "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" \
    "200"

# TC-AUTH-007: Get Profile
test_api \
    "TC-AUTH-007: Get Profile" \
    "GET" \
    "/auth/profile" \
    "" \
    "200" \
    "Authorization: Bearer $ACCESS_TOKEN"

# TC-ITEM-001: Get All Items
test_api \
    "TC-ITEM-001: Get All Items" \
    "GET" \
    "/items" \
    "" \
    "200"

# TC-ITEM-005: Create Item
test_api \
    "TC-ITEM-005: Create Item" \
    "POST" \
    "/items" \
    "{\"name\":\"Test Item\",\"description\":\"Test Description\",\"price\":100}" \
    "201" \
    "Authorization: Bearer $ACCESS_TOKEN"

echo ""
echo "======================================"
echo "Phase 2: Authentication Tests"
echo "======================================"

# TC-AUTH-002: Duplicate Email
test_api \
    "TC-AUTH-002: Duplicate Email" \
    "POST" \
    "/auth/register" \
    "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"name\":\"Another User\"}" \
    "400"

# TC-AUTH-003: Invalid Email
test_api \
    "TC-AUTH-003: Invalid Email" \
    "POST" \
    "/auth/register" \
    "{\"email\":\"invalid-email\",\"password\":\"$TEST_PASSWORD\",\"name\":\"Test User\"}" \
    "400"

# TC-AUTH-006: Invalid Credentials
test_api \
    "TC-AUTH-006: Invalid Credentials" \
    "POST" \
    "/auth/login" \
    "{\"email\":\"$TEST_EMAIL\",\"password\":\"WrongPassword123!\"}" \
    "401"

# TC-AUTH-008: No Token
test_api \
    "TC-AUTH-008: Access Without Token" \
    "GET" \
    "/auth/profile" \
    "" \
    "401"

echo ""
echo "======================================"
echo "Phase 3: Items Management Tests"
echo "======================================"

# TC-ITEM-003: Get Single Item
if [ -n "$ITEM_ID" ]; then
    test_api \
        "TC-ITEM-003: Get Single Item" \
        "GET" \
        "/items/$ITEM_ID" \
        "" \
        "200"
fi

# TC-ITEM-004: Item Not Found
test_api \
    "TC-ITEM-004: Item Not Found" \
    "GET" \
    "/items/99999" \
    "" \
    "404"

# TC-ITEM-006: Invalid Data
test_api \
    "TC-ITEM-006: Create Item - Invalid Data" \
    "POST" \
    "/items" \
    "{\"description\":\"No name\",\"price\":100}" \
    "400" \
    "Authorization: Bearer $ACCESS_TOKEN"

# TC-ITEM-007: Create Without Auth
test_api \
    "TC-ITEM-007: Create Without Auth" \
    "POST" \
    "/items" \
    "{\"name\":\"Unauthorized Item\",\"price\":100}" \
    "401"

# TC-ITEM-008: Update Item
if [ -n "$ITEM_ID" ]; then
    test_api \
        "TC-ITEM-008: Update Item" \
        "PATCH" \
        "/items/$ITEM_ID" \
        "{\"name\":\"Updated Item\",\"price\":200}" \
        "200" \
        "Authorization: Bearer $ACCESS_TOKEN"
fi

# TC-ITEM-010: Delete Item
if [ -n "$ITEM_ID" ]; then
    test_api \
        "TC-ITEM-010: Delete Item" \
        "DELETE" \
        "/items/$ITEM_ID" \
        "" \
        "200" \
        "Authorization: Bearer $ACCESS_TOKEN"
fi

# TC-ITEM-011: Delete Not Found
test_api \
    "TC-ITEM-011: Delete Not Found" \
    "DELETE" \
    "/items/99999" \
    "" \
    "404" \
    "Authorization: Bearer $ACCESS_TOKEN"

echo ""
echo "======================================"
echo "Phase 4: Categories Tests"
echo "======================================"

# TC-CAT-001: Get All Categories
test_api \
    "TC-CAT-001: Get All Categories" \
    "GET" \
    "/categories" \
    "" \
    "200"

# TC-CAT-002: Create Category
test_api \
    "TC-CAT-002: Create Category" \
    "POST" \
    "/categories" \
    "{\"name\":\"Test Category\",\"description\":\"Test Description\"}" \
    "201" \
    "Authorization: Bearer $ACCESS_TOKEN"

echo ""
echo "======================================"
echo "Phase 5: Error Handling Tests"
echo "======================================"

# TC-ERR-001: Invalid JSON
test_api \
    "TC-ERR-001: Invalid JSON" \
    "POST" \
    "/auth/login" \
    "invalid json" \
    "400"

# TC-ERR-004: Not Found Route
test_api \
    "TC-ERR-004: Not Found Route" \
    "GET" \
    "/nonexistent" \
    "" \
    "404"

echo ""
echo "======================================"
echo "📊 Test Results Summary"
echo "======================================"
echo -e "${GREEN}✓ Passed:${NC} $PASSED"
echo -e "${RED}✗ Failed:${NC} $FAILED"
echo "Total: $((PASSED + FAILED))"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed!${NC}"
    exit 1
fi

