# Backend Functional Test Plan

## Overview
Comprehensive functional testing for the PA Medicaid Helper backend, covering API routes, RAG agent, vector search, memory persistence, and error handling.

---

## Components to Test

| Component | Location | Priority |
|-----------|----------|----------|
| POST /api/chat | `app/api/chat/route.ts` | P0 |
| GET /api/initial-chat | `app/api/initial-chat/route.ts` | P0 |
| RAG Agent | `src/mastra/agents/rag-agent.ts` | P0 |
| Vector Search Tool | `src/mastra/tools/vector-search-tool.ts` | P0 |
| Memory System | Mastra Memory | P1 |
| Error Handling | All routes | P1 |

---

## Test Categories

### 1. API Route Tests (`/api/chat`)

**1.1 Basic Functionality**
- [ ] Send simple question, verify streaming response
- [ ] Verify response includes text content
- [ ] Verify response format matches AI SDK v5 UIMessage format
- [ ] Verify threadId is correctly passed and used

**1.2 RAG Integration**
- [ ] Ask Medicaid eligibility question → verify sources returned
- [ ] Ask benefits question → verify relevant context used
- [ ] Ask question with no matching docs → verify graceful fallback message
- [ ] Verify sources JSON format (`<sources>```json[...]```</sources>`)

**1.3 Model Configuration**
- [ ] Test with default model (Gemini 2.0 Flash)
- [ ] Test with custom model override in request body
- [ ] Verify OpenRouter API integration works

**1.4 Streaming**
- [ ] Verify streaming response (SSE format)
- [ ] Verify partial responses during generation
- [ ] Verify reasoning tokens included if available

### 2. API Route Tests (`/api/initial-chat`)

**2.1 Conversation History**
- [ ] New threadId returns empty array
- [ ] Existing threadId returns previous messages
- [ ] Verify message format (role, content)
- [ ] Default threadId ("rag-thread-1") works

**2.2 Memory Recall**
- [ ] Messages persist across requests
- [ ] Last 5 messages limit respected
- [ ] User and assistant messages both stored

### 3. RAG Agent Tests

**3.1 Tool Calling**
- [ ] Agent calls vectorSearchTool for questions
- [ ] Agent respects topK parameter (default 10)
- [ ] Agent stops after 3 search attempts max

**3.2 Response Quality**
- [ ] Responses are senior-friendly (simple language)
- [ ] Markdown formatting used correctly
- [ ] Important info is bolded
- [ ] Phone numbers included where available

**3.3 Edge Cases**
- [ ] Empty query handling
- [ ] Very long query handling
- [ ] Non-English query handling
- [ ] Off-topic question handling

**3.4 Special Scenarios**
- [ ] Sensitive topic disclaimer added (estate planning)
- [ ] Emotional distress response includes 988 helpline
- [ ] "Cannot do" boundaries respected (won't submit applications)

### 4. Vector Search Tool Tests

**4.1 Search Functionality**
- [ ] Returns relevant results for Medicaid queries
- [ ] Respects topK parameter (1-10)
- [ ] Returns resultCount accurately
- [ ] Returns sources with filename, title, section, score

**4.2 Context Building**
- [ ] Context limited to 4000 characters
- [ ] Multiple results concatenated properly
- [ ] Source attribution formatted correctly

**4.3 Edge Cases**
- [ ] Empty query returns empty results
- [ ] Query with no matches returns empty gracefully
- [ ] Very specific query finds exact match

### 5. Memory System Tests

**5.1 Persistence**
- [ ] Messages saved after chat request
- [ ] Messages retrievable via initial-chat
- [ ] Different threadIds maintain separate histories

**5.2 Limits**
- [ ] Only last 5 messages retained
- [ ] Older messages properly dropped

### 6. Error Handling Tests

**6.1 API Errors**
- [ ] Invalid request body returns appropriate error
- [ ] Missing required fields handled
- [ ] Rate limit errors surfaced to client

**6.2 Agent Errors**
- [ ] Model API failure handled gracefully
- [ ] Tool execution failure handled
- [ ] Timeout scenarios handled

---

## Test Implementation: Bash Script with Curl

### Script: `tests/backend/test-runner.sh`

**Features:**
- Color-coded output (green=pass, red=fail)
- jq for JSON validation
- Response capture for debugging
- Summary report at end
- Exit code for CI integration

**Structure:**
```bash
#!/bin/bash
# Backend Functional Tests for PA Medicaid Helper

BASE_URL="http://localhost:3000"
PASS=0
FAIL=0

# Helper functions
test_pass() { ((PASS++)); echo -e "\033[32m✓ $1\033[0m"; }
test_fail() { ((FAIL++)); echo -e "\033[31m✗ $1\033[0m"; }

# Test cases...
# Report summary
```

**Test Categories in Script:**
1. Health check (server running)
2. Chat endpoint tests
3. Initial-chat endpoint tests
4. RAG response validation
5. Memory persistence tests
6. Error handling tests

---

## Test Execution Plan

### Phase 1: Smoke Tests (Critical Path)
```bash
# 1. Chat endpoint basic
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"What is Medicaid?"}],"threadId":"test-1"}'

# 2. Initial chat endpoint
curl "http://localhost:3000/api/initial-chat?threadId=test-1"

# 3. RAG search verification
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Am I eligible for PA Medicaid?"}],"threadId":"test-2"}'
```

### Phase 2: Comprehensive Tests
- Run all test categories above
- Document results with pass/fail
- Capture response samples

### Phase 3: Edge Case & Error Tests
- Test error conditions
- Verify graceful degradation
- Check rate limit handling

---

## Expected Outputs

### Successful Chat Response
```
- Streaming text response
- Sources in <sources> block
- Senior-friendly formatting
- Relevant Medicaid information
```

### Successful Initial Chat Response
```json
[
  {"role": "user", "content": "..."},
  {"role": "assistant", "content": "..."}
]
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `tests/backend/test-runner.sh` | Main bash test script (executable) |
| `docs/test_results/backend-test-results.md` | Test results documentation |

### Script Sections

1. **Setup & Helpers** - Color functions, counters, base URL
2. **Smoke Tests** - Server health, basic endpoint connectivity
3. **Chat API Tests** - Streaming, RAG responses, sources validation
4. **Initial-Chat Tests** - History retrieval, empty state
5. **Memory Tests** - Persistence, thread isolation
6. **Edge Cases** - Empty queries, long queries, off-topic
7. **Error Tests** - Invalid input, missing fields
8. **Summary Report** - Pass/fail counts, exit code

---

## Success Criteria

- [ ] All P0 tests pass
- [ ] All P1 tests pass
- [ ] No critical errors in logs
- [ ] Response times < 30s for chat
- [ ] Sources returned for relevant queries
- [ ] Memory persistence working
