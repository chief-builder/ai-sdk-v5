# Backend Functional Test Results

**Date:** 2026-01-06
**Test Runner:** `tests/backend/test-runner.sh`
**Server:** http://localhost:3000

---

## Summary

| Metric | Count |
|--------|-------|
| **Passed** | 22 |
| **Failed** | 0 |
| **Skipped** | 0 |
| **Total** | 22 |

**Status:** All tests passed

---

## Test Categories

### 1. Smoke Tests (3/3 passed)

| Test | Status | Notes |
|------|--------|-------|
| Server responds with HTTP 200 | ✓ | |
| POST /api/chat returns 200 | ✓ | |
| GET /api/initial-chat returns 200 | ✓ | |

### 2. Chat API Tests (3/3 passed)

| Test | Status | Notes |
|------|--------|-------|
| Chat endpoint returns response | ✓ | Streaming response received |
| Response contains relevant content | ✓ | Medicaid-related content found |
| Response is in streaming format | ✓ | SSE format detected |

### 3. RAG Integration Tests (3/3 passed)

| Test | Status | Notes |
|------|--------|-------|
| Eligibility question returns sources | ✓ | Sources block or relevant content |
| Sources contain valid JSON | ✓ | Alternate format validated |
| Benefits question returns relevant content | ✓ | Benefits-related content found |

#### Detailed RAG Test Results

---

**Test 3.1: Eligibility Question**

**Request:**
```json
{
  "messages": [{"role": "user", "content": "Am I eligible for PA Medicaid?"}],
  "threadId": "doc-test-elig-1"
}
```

**Vector Search Tool Call:**
```json
{
  "query": "PA Medicaid eligibility requirements",
  "topK": 10
}
```

**Sources Retrieved (Top 5):**

| Source | Score | Section |
|--------|-------|---------|
| PA-DHS-Healthy-Horizons.pdf | 0.816 | Page 1 |
| PA-DHS-Long-Term-Care.pdf | 0.788 | Page 1 |
| PHLP-2025-Income-Limits.pdf | 0.783 | Page 1 |
| PHLP-CHC-Waiver-Eligibility-Guide.pdf | 0.782 | Page 6 |
| PA-PACE-PACENET-Provider-Guide-2025.pdf | 0.772 | Page 6 |

**Response Summary:**
The agent provided a comprehensive answer including:
- Who is eligible (ages 65+, disabilities, blind)
- Non-financial requirements (citizenship, residency, SSN)
- Income limits tables for NMP and MNO categories
- Warning about 5-year asset transfer lookback
- Application methods (COMPASS, County Assistance Office)

**Interpretation:**
✓ RAG successfully retrieved relevant eligibility documents with high similarity scores (0.75-0.82).
✓ Agent correctly synthesized information from multiple sources into structured markdown tables.
✓ Sources block included with proper JSON format linking to source documents.
✓ Response is senior-friendly with clear headings and bold emphasis on key figures.

---

**Test 3.2: Benefits Question**

**Request:**
```json
{
  "messages": [{"role": "user", "content": "What benefits does PA Medicaid cover?"}],
  "threadId": "doc-test-benefits-1"
}
```

**Vector Search Tool Call:**
```json
{
  "query": "PA Medicaid covered benefits",
  "topK": 10
}
```

**Sources Retrieved (Top 5):**

| Source | Score | Section |
|--------|-------|---------|
| PA-DHS-Healthy-Horizons.pdf | 0.804 | Page 1 |
| PHLP-Using-Medicare-Medicaid-Guide.pdf | 0.790 | Page 2 |
| PHLP-Using-Medicare-Medicaid-Guide.pdf | 0.787 | Page 1 |
| PHLP-2025-Income-Limits.pdf | 0.786 | Page 1 |
| PA-DHS-Healthy-Horizons.pdf | 0.763 | Page 2 |

**Response Summary:**
The agent acknowledged partial information availability and provided:
- Overview of who Medicaid serves (65+, disabilities, blind)
- Explanation of how Medicare and Medicaid work together
- Source attribution explaining which documents informed the answer

**Interpretation:**
✓ RAG retrieved relevant documents but knowledge base has limited explicit benefits coverage details.
✓ Agent honestly stated "I don't have a complete answer" rather than hallucinating.
✓ Agent provided useful context from available sources about the program.
✓ Sources block properly formatted with 2 cited documents.
⚠ Response was shorter than eligibility query - reflects actual knowledge base content gaps.

---

**Test 3.3: Off-Topic Question (Edge Case)**

**Request:**
```json
{
  "messages": [{"role": "user", "content": "What is the capital of France?"}],
  "threadId": "doc-test-offtopic-1"
}
```

**Vector Search Tool Call:** None (agent did not invoke tool)

**Response:**
> "I am designed to provide information about Pennsylvania Medicaid for seniors. I cannot answer general knowledge questions. I'm happy to help with any questions about eligibility, benefits, enrollment, or services available to you."

**Interpretation:**
✓ Agent correctly identified query as off-topic without searching the knowledge base.
✓ Agent politely declined and redirected to its domain expertise.
✓ No hallucination or attempt to answer outside its scope.
✓ Response size: 599 bytes (minimal, appropriate for redirect).
✓ Demonstrates proper system prompt adherence for scope boundaries.

### 4. Initial Chat Tests (4/4 passed)

| Test | Status | Notes |
|------|--------|-------|
| Returns valid JSON | ✓ | |
| Response is an array | ✓ | |
| New thread returns empty array | ✓ | |
| Default threadId (rag-thread-1) works | ✓ | |

### 5. Memory Persistence Tests (3/3 passed)

| Test | Status | Notes |
|------|--------|-------|
| Sent initial message | ✓ | |
| Messages persist in memory | ✓ | 2 messages found |
| User messages are stored | ✓ | |

### 6. Edge Case Tests (3/3 passed)

| Test | Status | Notes |
|------|--------|-------|
| Empty message handled | ✓ | Got response |
| Long query handled | ✓ | |
| Off-topic question handled gracefully | ✓ | |

### 7. Error Handling Tests (3/3 passed)

| Test | Status | Notes |
|------|--------|-------|
| Invalid JSON returns error | ✓ | HTTP 500 |
| Missing messages field handled | ✓ | HTTP 200 (graceful) |
| Empty messages array handled | ✓ | HTTP 200 |

---

## How to Run

```bash
# Full test suite
./tests/backend/test-runner.sh

# Smoke tests only
./tests/backend/test-runner.sh --smoke-only

# With verbose output
./tests/backend/test-runner.sh -v

# Custom server URL
./tests/backend/test-runner.sh -u http://localhost:8080
```

---

## Notes

- Tests require the dev server to be running (`pnpm dev`)
- Tests use unique thread IDs for isolation
- RAG tests may vary slightly based on model response
- Memory tests include a 2-second wait for persistence
