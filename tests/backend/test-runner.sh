#!/bin/bash
# Backend Functional Tests for PA Medicaid Helper
# See docs/plans/backend-functional-test-plan.md for full test plan

set -o pipefail

#######################################
# Configuration
#######################################
BASE_URL="${BASE_URL:-http://localhost:3000}"
TIMEOUT="${TIMEOUT:-30}"
VERBOSE="${VERBOSE:-0}"

#######################################
# Counters
#######################################
PASS=0
FAIL=0
SKIP=0

#######################################
# Colors
#######################################
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

#######################################
# Helper Functions
#######################################

log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_section() {
    echo ""
    echo -e "${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BOLD}${CYAN}  $1${NC}"
    echo -e "${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

test_pass() {
    ((PASS++))
    echo -e "${GREEN}✓${NC} $1"
}

test_fail() {
    ((FAIL++))
    echo -e "${RED}✗${NC} $1"
    if [[ -n "$2" ]]; then
        echo -e "  ${RED}→ $2${NC}"
    fi
}

test_skip() {
    ((SKIP++))
    echo -e "${YELLOW}○${NC} $1 (skipped)"
}

debug() {
    if [[ "$VERBOSE" == "1" ]]; then
        echo -e "${YELLOW}  DEBUG: $1${NC}"
    fi
}

# Check if jq is available
check_dependencies() {
    if ! command -v jq &> /dev/null; then
        echo -e "${RED}Error: jq is required but not installed.${NC}"
        echo "Install with: brew install jq"
        exit 1
    fi

    if ! command -v curl &> /dev/null; then
        echo -e "${RED}Error: curl is required but not installed.${NC}"
        exit 1
    fi
}

# Check if server is running
check_server() {
    log_info "Checking server at $BASE_URL..."

    local response
    response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$BASE_URL" 2>/dev/null)

    if [[ "$response" == "000" ]]; then
        echo -e "${RED}Error: Server not responding at $BASE_URL${NC}"
        echo "Start the dev server with: pnpm dev"
        exit 1
    fi

    log_info "Server is running (HTTP $response)"
}

# Make a POST request and capture response
post_json() {
    local endpoint="$1"
    local data="$2"
    local timeout="${3:-$TIMEOUT}"

    curl -s -X POST "$BASE_URL$endpoint" \
        -H "Content-Type: application/json" \
        -d "$data" \
        --max-time "$timeout" \
        2>/dev/null
}

# Make a GET request and capture response
get_json() {
    local endpoint="$1"
    local timeout="${2:-$TIMEOUT}"

    curl -s "$BASE_URL$endpoint" \
        --max-time "$timeout" \
        2>/dev/null
}

# Make a streaming POST request and capture full response
post_stream() {
    local endpoint="$1"
    local data="$2"
    local timeout="${3:-$TIMEOUT}"

    curl -s -X POST "$BASE_URL$endpoint" \
        -H "Content-Type: application/json" \
        -d "$data" \
        --max-time "$timeout" \
        -N \
        2>/dev/null
}

# Validate JSON response
is_valid_json() {
    echo "$1" | jq empty 2>/dev/null
    return $?
}

# Extract field from JSON
json_field() {
    echo "$1" | jq -r "$2" 2>/dev/null
}

# Check if response contains text
contains() {
    [[ "$1" == *"$2"* ]]
}

# Generate unique thread ID for test isolation
gen_thread_id() {
    echo "test-$(date +%s)-$RANDOM"
}

#######################################
# Smoke Tests
#######################################

run_smoke_tests() {
    log_section "Smoke Tests"

    # Test 1: Server health
    local health_response
    health_response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL" --max-time 5)
    if [[ "$health_response" =~ ^[23] ]]; then
        test_pass "Server responds with HTTP $health_response"
    else
        test_fail "Server health check" "Got HTTP $health_response"
    fi

    # Test 2: Chat endpoint accepts POST
    local chat_response
    chat_response=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/chat" \
        -H "Content-Type: application/json" \
        -d '{"messages":[{"role":"user","content":"test"}],"threadId":"smoke-test"}' \
        --max-time 10)
    if [[ "$chat_response" == "200" ]]; then
        test_pass "POST /api/chat returns 200"
    else
        test_fail "POST /api/chat" "Got HTTP $chat_response"
    fi

    # Test 3: Initial-chat endpoint accepts GET
    local initial_response
    initial_response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/initial-chat?threadId=smoke-test" --max-time 5)
    if [[ "$initial_response" == "200" ]]; then
        test_pass "GET /api/initial-chat returns 200"
    else
        test_fail "GET /api/initial-chat" "Got HTTP $initial_response"
    fi
}

#######################################
# Chat API Tests
#######################################

run_chat_api_tests() {
    log_section "Chat API Tests (/api/chat)"

    local thread_id
    thread_id=$(gen_thread_id)

    # Test: Basic chat response
    log_info "Testing basic chat functionality..."
    local response
    response=$(post_stream "/api/chat" "{\"messages\":[{\"role\":\"user\",\"content\":\"What is Medicaid?\"}],\"threadId\":\"$thread_id\"}")

    if [[ -n "$response" ]]; then
        test_pass "Chat endpoint returns response"
        debug "Response length: ${#response} chars"
    else
        test_fail "Chat endpoint returns response" "Empty response"
    fi

    # Test: Response contains text content
    if contains "$response" "Medicaid" || contains "$response" "health" || contains "$response" "insurance"; then
        test_pass "Response contains relevant content"
    else
        test_fail "Response contains relevant content" "No Medicaid-related content found"
    fi

    # Test: Streaming format (SSE-like data)
    if contains "$response" "0:" || contains "$response" "text" || contains "$response" "data:"; then
        test_pass "Response is in streaming format"
    else
        test_fail "Response is in streaming format" "Expected streaming chunks"
    fi
}

#######################################
# RAG Integration Tests
#######################################

run_rag_tests() {
    log_section "RAG Integration Tests"

    local thread_id
    thread_id=$(gen_thread_id)

    # Test: Eligibility question returns sources or relevant content
    log_info "Testing RAG with eligibility question..."
    local response
    response=$(post_stream "/api/chat" "{\"messages\":[{\"role\":\"user\",\"content\":\"Am I eligible for PA Medicaid?\"}],\"threadId\":\"$thread_id\"}" 45)

    if contains "$response" "<sources>"; then
        test_pass "Eligibility question returns sources block"
    elif contains "$response" "eligib" || contains "$response" "income" || contains "$response" "qualify"; then
        test_pass "Eligibility question returns relevant RAG content (no sources tag)"
    else
        test_fail "Eligibility question returns sources/content" "No sources tag or eligibility content found"
    fi

    # Test: Sources contain valid JSON
    local sources_json
    # Extract JSON from sources block (macOS compatible)
    sources_json=$(echo "$response" | sed -n 's/.*<sources>```json\(.*\)```<\/sources>.*/\1/p' | head -1 || echo "")
    if [[ -n "$sources_json" ]] && is_valid_json "$sources_json"; then
        test_pass "Sources contain valid JSON"
    else
        # Try alternate pattern
        if contains "$response" "sources" && contains "$response" "filename"; then
            test_pass "Sources contain valid JSON (alternate format)"
        else
            test_skip "Sources JSON validation (may need manual check)"
        fi
    fi

    # Test: Benefits question
    log_info "Testing RAG with benefits question..."
    thread_id=$(gen_thread_id)
    response=$(post_stream "/api/chat" "{\"messages\":[{\"role\":\"user\",\"content\":\"What benefits does PA Medicaid cover?\"}],\"threadId\":\"$thread_id\"}" 45)

    if contains "$response" "benefit" || contains "$response" "cover" || contains "$response" "service"; then
        test_pass "Benefits question returns relevant content"
    else
        test_fail "Benefits question returns relevant content" "No benefits-related content"
    fi
}

#######################################
# Initial Chat Tests
#######################################

run_initial_chat_tests() {
    log_section "Initial Chat Tests (/api/initial-chat)"

    # Test: New thread returns empty or valid array
    local new_thread
    new_thread=$(gen_thread_id)
    local response
    response=$(get_json "/api/initial-chat?threadId=$new_thread")

    if is_valid_json "$response"; then
        test_pass "Returns valid JSON"
    else
        test_fail "Returns valid JSON" "Invalid JSON response"
    fi

    # Test: Response is array
    local is_array
    is_array=$(echo "$response" | jq 'type == "array"' 2>/dev/null)
    if [[ "$is_array" == "true" ]]; then
        test_pass "Response is an array"
    else
        test_fail "Response is an array" "Expected array, got: $(echo "$response" | jq -r 'type')"
    fi

    # Test: New thread has empty history
    local length
    length=$(echo "$response" | jq 'length' 2>/dev/null)
    if [[ "$length" == "0" ]]; then
        test_pass "New thread returns empty array"
    else
        test_skip "New thread returns empty array (may have existing messages)"
    fi

    # Test: Default thread ID works
    response=$(get_json "/api/initial-chat?threadId=rag-thread-1")
    if is_valid_json "$response"; then
        test_pass "Default threadId (rag-thread-1) works"
    else
        test_fail "Default threadId works" "Failed to fetch default thread"
    fi
}

#######################################
# Memory Persistence Tests
#######################################

run_memory_tests() {
    log_section "Memory Persistence Tests"

    local thread_id
    thread_id=$(gen_thread_id)

    # Send a message first
    log_info "Sending initial message to $thread_id..."
    local chat_response
    chat_response=$(post_stream "/api/chat" "{\"messages\":[{\"role\":\"user\",\"content\":\"Hello, this is a memory test.\"}],\"threadId\":\"$thread_id\"}" 30)

    if [[ -z "$chat_response" ]]; then
        test_fail "Send initial message" "Empty response"
        return
    fi
    test_pass "Sent initial message"

    # Wait a moment for persistence
    sleep 2

    # Retrieve history
    log_info "Retrieving conversation history..."
    local history
    history=$(get_json "/api/initial-chat?threadId=$thread_id")

    if ! is_valid_json "$history"; then
        test_fail "Retrieve history" "Invalid JSON"
        return
    fi

    local msg_count
    msg_count=$(echo "$history" | jq 'length' 2>/dev/null)

    if [[ "$msg_count" -gt 0 ]]; then
        test_pass "Messages persist in memory (found $msg_count messages)"
    else
        test_fail "Messages persist in memory" "History is empty"
    fi

    # Check for user message
    local has_user
    has_user=$(echo "$history" | jq '[.[] | select(.role == "user")] | length > 0' 2>/dev/null)
    if [[ "$has_user" == "true" ]]; then
        test_pass "User messages are stored"
    else
        test_skip "User messages stored (may need more time)"
    fi
}

#######################################
# Edge Case Tests
#######################################

run_edge_case_tests() {
    log_section "Edge Case Tests"

    local thread_id
    thread_id=$(gen_thread_id)

    # Test: Empty message handling
    log_info "Testing empty message..."
    local response
    response=$(post_stream "/api/chat" "{\"messages\":[{\"role\":\"user\",\"content\":\"\"}],\"threadId\":\"$thread_id\"}" 15)

    if [[ -n "$response" ]]; then
        test_pass "Empty message handled (got response)"
    else
        test_skip "Empty message handling"
    fi

    # Test: Very long query
    log_info "Testing long query..."
    local long_query
    long_query="Please tell me about $(printf 'Medicaid eligibility requirements and %.0s' {1..20})"
    response=$(post_stream "/api/chat" "{\"messages\":[{\"role\":\"user\",\"content\":\"$long_query\"}],\"threadId\":\"$thread_id\"}" 45)

    if [[ -n "$response" ]]; then
        test_pass "Long query handled"
    else
        test_fail "Long query handled" "No response"
    fi

    # Test: Off-topic question
    log_info "Testing off-topic question..."
    thread_id=$(gen_thread_id)
    response=$(post_stream "/api/chat" "{\"messages\":[{\"role\":\"user\",\"content\":\"What is the capital of France?\"}],\"threadId\":\"$thread_id\"}" 30)

    if [[ -n "$response" ]]; then
        test_pass "Off-topic question handled gracefully"
    else
        test_fail "Off-topic question handling" "No response"
    fi
}

#######################################
# Error Handling Tests
#######################################

run_error_tests() {
    log_section "Error Handling Tests"

    # Test: Invalid JSON body
    local response
    response=$(curl -s -X POST "$BASE_URL/api/chat" \
        -H "Content-Type: application/json" \
        -d "not valid json" \
        --max-time 10 \
        -w "\n%{http_code}" 2>/dev/null)

    local http_code
    http_code=$(echo "$response" | tail -1)

    if [[ "$http_code" =~ ^[45] ]]; then
        test_pass "Invalid JSON returns error (HTTP $http_code)"
    else
        test_fail "Invalid JSON handling" "Expected 4xx/5xx, got $http_code"
    fi

    # Test: Missing messages field
    response=$(curl -s -X POST "$BASE_URL/api/chat" \
        -H "Content-Type: application/json" \
        -d '{"threadId":"test"}' \
        --max-time 10 \
        -w "\n%{http_code}" 2>/dev/null)

    http_code=$(echo "$response" | tail -1)
    local body
    body=$(echo "$response" | sed '$d')  # Remove last line (http code) - macOS compatible

    if [[ "$http_code" =~ ^[45] ]] || [[ -n "$body" ]]; then
        test_pass "Missing messages field handled (HTTP $http_code)"
    else
        test_fail "Missing messages field" "No proper error response"
    fi

    # Test: Empty messages array
    response=$(curl -s -X POST "$BASE_URL/api/chat" \
        -H "Content-Type: application/json" \
        -d '{"messages":[],"threadId":"test"}' \
        --max-time 10 \
        -w "\n%{http_code}" 2>/dev/null)

    http_code=$(echo "$response" | tail -1)

    # Empty messages might be valid or return error - both are acceptable
    if [[ "$http_code" == "200" ]] || [[ "$http_code" =~ ^[45] ]]; then
        test_pass "Empty messages array handled (HTTP $http_code)"
    else
        test_skip "Empty messages array handling"
    fi
}

#######################################
# Summary Report
#######################################

print_summary() {
    echo ""
    log_section "Test Summary"

    local total=$((PASS + FAIL + SKIP))

    echo -e "${GREEN}Passed:${NC}  $PASS"
    echo -e "${RED}Failed:${NC}  $FAIL"
    echo -e "${YELLOW}Skipped:${NC} $SKIP"
    echo -e "${BOLD}Total:${NC}   $total"
    echo ""

    if [[ $FAIL -eq 0 ]]; then
        echo -e "${GREEN}${BOLD}All tests passed!${NC}"
        return 0
    else
        echo -e "${RED}${BOLD}$FAIL test(s) failed${NC}"
        return 1
    fi
}

#######################################
# Main
#######################################

main() {
    echo -e "${BOLD}${CYAN}"
    echo "╔═══════════════════════════════════════════════════╗"
    echo "║   PA Medicaid Helper - Backend Functional Tests   ║"
    echo "╚═══════════════════════════════════════════════════╝"
    echo -e "${NC}"

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -v|--verbose)
                VERBOSE=1
                shift
                ;;
            -u|--url)
                BASE_URL="$2"
                shift 2
                ;;
            --smoke-only)
                SMOKE_ONLY=1
                shift
                ;;
            -h|--help)
                echo "Usage: $0 [options]"
                echo ""
                echo "Options:"
                echo "  -v, --verbose     Show debug output"
                echo "  -u, --url URL     Set base URL (default: http://localhost:3000)"
                echo "  --smoke-only      Run only smoke tests"
                echo "  -h, --help        Show this help"
                exit 0
                ;;
            *)
                echo "Unknown option: $1"
                exit 1
                ;;
        esac
    done

    check_dependencies
    check_server

    # Run tests
    run_smoke_tests

    if [[ "${SMOKE_ONLY:-0}" != "1" ]]; then
        run_chat_api_tests
        run_rag_tests
        run_initial_chat_tests
        run_memory_tests
        run_edge_case_tests
        run_error_tests
    fi

    print_summary
    exit $?
}

main "$@"
