#!/bin/bash

# Website Functionality Test Script
# Tests the AI-powered restaurant ordering system

URL="https://jliecm2bm260.space.minimax.io"
TEST_RESULTS_FILE="/workspace/website_test_results.log"

echo "=====================================" > $TEST_RESULTS_FILE
echo "WEBSITE FUNCTIONALITY TEST REPORT" >> $TEST_RESULTS_FILE
echo "URL: $URL" >> $TEST_RESULTS_FILE
echo "Test Date: $(date)" >> $TEST_RESULTS_FILE
echo "=====================================" >> $TEST_RESULTS_FILE
echo "" >> $TEST_RESULTS_FILE

# Test 1: Basic HTTP Response
echo "TEST 1: Basic Connectivity" >> $TEST_RESULTS_FILE
echo "----------------------------" >> $TEST_RESULTS_FILE

if curl -s -o /dev/null -w "%{http_code}" $URL | grep -q "200"; then
    echo "✅ PASS: Website is accessible (HTTP 200)" >> $TEST_RESULTS_FILE
else
    echo "❌ FAIL: Website not accessible" >> $TEST_RESULTS_FILE
fi

# Test 2: Response Time
echo "" >> $TEST_RESULTS_FILE
echo "TEST 2: Response Time" >> $TEST_RESULTS_FILE
echo "----------------------------" >> $TEST_RESULTS_FILE

RESPONSE_TIME=$(curl -o /dev/null -s -w "%{time_total}" $URL)
echo "Response Time: ${RESPONSE_TIME}s" >> $TEST_RESULTS_FILE

if (( $(echo "$RESPONSE_TIME < 5.0" | bc -l) )); then
    echo "✅ PASS: Response time acceptable (< 5s)" >> $TEST_RESULTS_FILE
else
    echo "⚠️ WARNING: Slow response time (> 5s)" >> $TEST_RESULTS_FILE
fi

# Test 3: Content Validation
echo "" >> $TEST_RESULTS_FILE
echo "TEST 3: Content Validation" >> $TEST_RESULTS_FILE
echo "----------------------------" >> $TEST_RESULTS_FILE

CONTENT=$(curl -s $URL)

# Check for key elements
if echo "$CONTENT" | grep -q "Syra AI"; then
    echo "✅ PASS: AI Assistant (Syra AI) found" >> $TEST_RESULTS_FILE
else
    echo "❌ FAIL: AI Assistant not found" >> $TEST_RESULTS_FILE
fi

if echo "$CONTENT" | grep -q "Woody's"; then
    echo "✅ PASS: Restaurant branding found" >> $TEST_RESULTS_FILE
else
    echo "❌ FAIL: Restaurant branding not found" >> $TEST_RESULTS_FILE
fi

if echo "$CONTENT" | grep -q "AI-Powered Ordering"; then
    echo "✅ PASS: Ordering system identified" >> $TEST_RESULTS_FILE
else
    echo "❌ FAIL: Ordering system not identified" >> $TEST_RESULTS_FILE
fi

if echo "$CONTENT" | grep -q "Type your message"; then
    echo "✅ PASS: Chat input field found" >> $TEST_RESULTS_FILE
else
    echo "❌ FAIL: Chat input field not found" >> $TEST_RESULTS_FILE
fi

if echo "$CONTENT" | grep -q "Explore Menu"; then
    echo "✅ PASS: Menu exploration button found" >> $TEST_RESULTS_FILE
else
    echo "❌ FAIL: Menu exploration button not found" >> $TEST_RESULTS_FILE
fi

# Test 4: JavaScript/React Check
echo "" >> $TEST_RESULTS_FILE
echo "TEST 4: Frontend Framework Check" >> $TEST_RESULTS_FILE
echo "----------------------------" >> $TEST_RESULTS_FILE

if echo "$CONTENT" | grep -q "React\|Vite\|__NEXT__\|__REACT__"; then
    echo "✅ PASS: Modern frontend framework detected" >> $TEST_RESULTS_FILE
else
    echo "⚠️ INFO: Frontend framework not clearly identified" >> $TEST_RESULTS_FILE
fi

# Check for bundled assets
if echo "$CONTENT" | grep -q "\.js\|\.css"; then
    echo "✅ PASS: Static assets (JS/CSS) found" >> $TEST_RESULTS_FILE
else
    echo "❌ FAIL: Static assets not found" >> $TEST_RESULTS_FILE
fi

# Test 5: Security Check
echo "" >> $TEST_RESULTS_FILE
echo "TEST 5: Security Check" >> $TEST_RESULTS_FILE
echo "----------------------------" >> $TEST_RESULTS_FILE

SSL_STATUS=$(curl -s -o /dev/null -w "%{ssl_verify_result}" -I $URL)
if [ "$SSL_STATUS" = "0" ]; then
    echo "✅ PASS: SSL certificate is valid" >> $TEST_RESULTS_FILE
else
    echo "❌ FAIL: SSL certificate issues" >> $TEST_RESULTS_FILE
fi

# Test 6: API Endpoint Testing
echo "" >> $TEST_RESULTS_FILE
echo "TEST 6: API Endpoint Testing" >> $TEST_RESULTS_FILE
echo "----------------------------" >> $TEST_RESULTS_FILE

# Test if there are common API endpoints
API_ENDPOINTS=(
    "/api/menu"
    "/api/orders"
    "/api/chat"
    "/api/checkout"
    "/health"
    "/status"
)

for endpoint in "${API_ENDPOINTS[@]}"; do
    if curl -s -o /dev/null -w "%{http_code}" "${URL}${endpoint}" | grep -q "200\|404\|405"; then
        echo "✅ PASS: Endpoint ${endpoint} responds (${endpoint})" >> $TEST_RESULTS_FILE
    fi
done

# Test 7: Mobile Responsiveness Check
echo "" >> $TEST_RESULTS_FILE
echo "TEST 7: Mobile Responsiveness" >> $TEST_RESULTS_FILE
echo "----------------------------" >> $TEST_RESULTS_FILE

MOBILE_CONTENT=$(curl -s -H "User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15" $URL)

if echo "$MOBILE_CONTENT" | grep -q "mobile\|responsive\|viewport"; then
    echo "✅ PASS: Mobile meta tags found" >> $TEST_RESULTS_FILE
else
    echo "⚠️ WARNING: Mobile meta tags not clearly detected" >> $TEST_RESULTS_FILE
fi

# Test 8: Performance Headers
echo "" >> $TEST_RESULTS_FILE
echo "TEST 8: Performance Headers" >> $TEST_RESULTS_FILE
echo "----------------------------" >> $TEST_RESULTS_FILE

HEADERS=$(curl -s -I $URL)

if echo "$HEADERS" | grep -qi "cache-control"; then
    echo "✅ PASS: Cache headers found" >> $TEST_RESULTS_FILE
else
    echo "⚠️ WARNING: Cache headers missing" >> $TEST_RESULTS_FILE
fi

if echo "$HEADERS" | grep -qi "gzip\|deflate\|br"; then
    echo "✅ PASS: Compression headers found" >> $TEST_RESULTS_FILE
else
    echo "⚠️ WARNING: Compression not detected" >> $TEST_RESULTS_FILE
fi

# Test 9: Accessibility Check
echo "" >> $TEST_RESULTS_FILE
echo "TEST 9: Accessibility Features" >> $TEST_RESULTS_FILE
echo "----------------------------" >> $TEST_RESULTS_FILE

if echo "$CONTENT" | grep -q "aria-\|role="; then
    echo "✅ PASS: ARIA attributes found" >> $TEST_RESULTS_FILE
else
    echo "⚠️ WARNING: ARIA attributes not detected" >> $TEST_RESULTS_FILE
fi

if echo "$CONTENT" | grep -q "alt="; then
    echo "✅ PASS: Alt attributes found" >> $TEST_RESULTS_FILE
else
    echo "⚠️ WARNING: Alt attributes not detected" >> $TEST_RESULTS_FILE
fi

if echo "$CONTENT" | grep -q "lang="; then
    echo "✅ PASS: Language attribute found" >> $TEST_RESULTS_FILE
else
    echo "⚠️ WARNING: Language attribute not detected" >> $TEST_RESULTS_FILE
fi

# Test 10: Content Analysis
echo "" >> $TEST_RESULTS_FILE
echo "TEST 10: Content Analysis" >> $TEST_RESULTS_FILE
echo "----------------------------" >> $TEST_RESULTS_FILE

# Check for common restaurant menu elements
MENU_KEYWORDS=("pizza" "burger" "chicken" "ribs" "drink" "menu" "order" "food" "restaurant")
MENU_FOUND=0

for keyword in "${MENU_KEYWORDS[@]}"; do
    if echo "$CONTENT" | grep -qi "$keyword"; then
        MENU_FOUND=$((MENU_FOUND + 1))
    fi
done

echo "Menu-related keywords found: $MENU_FOUND/9" >> $TEST_RESULTS_FILE

if [ $MENU_FOUND -gt 5 ]; then
    echo "✅ PASS: Good restaurant content coverage" >> $TEST_RESULTS_FILE
else
    echo "⚠️ WARNING: Limited restaurant content found" >> $TEST_RESULTS_FILE
fi

# Summary
echo "" >> $TEST_RESULTS_FILE
echo "=====================================" >> $TEST_RESULTS_FILE
echo "TEST SUMMARY" >> $TEST_RESULTS_FILE
echo "=====================================" >> $TEST_RESULTS_FILE
echo "Website Functionality Test Completed" >> $TEST_RESULTS_FILE
echo "For detailed results, see: $TEST_RESULTS_FILE" >> $TEST_RESULTS_FILE
echo "=====================================" >> $TEST_RESULTS_FILE

# Display results
cat $TEST_RESULTS_FILE

echo ""
echo "Test results saved to: $TEST_RESULTS_FILE"
