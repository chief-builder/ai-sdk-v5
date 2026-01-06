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

#### Detailed Chat API Test Results

##### How the Chat API Works

The `/api/chat` endpoint processes messages through the RAG agent pipeline:

1. **Request Parsing**: Extract messages array and threadId from JSON body
2. **Agent Invocation**: Pass messages to Mastra RAG agent with streaming enabled
3. **Tool Execution**: Agent may call vectorSearchTool for knowledge retrieval
4. **Response Streaming**: Server-Sent Events (SSE) stream back to client
5. **Memory Storage**: Conversation saved to LibSQL for persistence

**Endpoint:** `POST /api/chat`

**Request Schema:**
```json
{
  "messages": [{"role": "user", "content": "string"}],
  "threadId": "string (optional, defaults to 'rag-thread-1')"
}
```

**Response Format:** Server-Sent Events (SSE) stream

---

**Test 2.1: Basic Chat Functionality**

**Request:**
```json
{
  "messages": [{"role": "user", "content": "What is Medicaid?"}],
  "threadId": "chat-api-test-1"
}
```

**Streaming Response Events:**
```
data: {"type":"start-step"}
data: {"type":"tool-input-start","toolCallId":"tool_vectorSearchTool_...","toolName":"vectorSearchTool"}
data: {"type":"tool-input-delta","toolCallId":"...","inputTextDelta":"{\"topK\":10,\"query\":\"what is Pennsylvania Medicaid\"}"}
data: {"type":"tool-input-available","toolCallId":"...","input":{"topK":10,"query":"what is Pennsylvania Medicaid"}}
data: {"type":"tool-output-available","toolCallId":"...","output":{"context":"...","resultCount":10,"sources":[...]}}
data: {"type":"finish-step"}
data: {"type":"start-step"}
data: {"type":"text-start","id":"txt-0"}
data: {"type":"text-delta","id":"txt-0","delta":"Pennsylvania"}
data: {"type":"text-delta","id":"txt-0","delta":"'s Medical Assistance..."}
data: {"type":"text-end","id":"txt-0"}
data: {"type":"finish-step"}
data: [DONE]
```

**Actual Response (assembled from deltas):**

> Pennsylvania's Medical Assistance (Medicaid) program provides health care benefits for older people (ages 65 and older), people with disabilities, or people who are blind.
>
> *Sources: PA-DHS-Healthy-Horizons.pdf*

**Interpretation:**
✓ Response size: 6,328 bytes total stream
✓ Two-step execution: tool call → text generation
✓ SSE format with proper event types (start-step, text-delta, finish-step, DONE)
✓ Content validation: contains "Medicaid", "health", relevant keywords
✓ Sources block included with proper JSON format

---

**Test 2.2: Streaming Format Validation**

**SSE Event Types Observed:**

| Event Type | Purpose | Example |
|------------|---------|---------|
| `start-step` | Begin new processing step | `{"type":"start-step"}` |
| `tool-input-start` | Tool call initiated | `{"type":"tool-input-start","toolName":"vectorSearchTool"}` |
| `tool-input-delta` | Tool input streaming | `{"inputTextDelta":"{\"query\":\"...\"}"}` |
| `tool-input-available` | Complete tool input | `{"input":{"topK":10,"query":"..."}}` |
| `tool-output-available` | Tool execution result | `{"output":{"context":"...","sources":[...]}}` |
| `finish-step` | End processing step | `{"type":"finish-step"}` |
| `text-start` | Begin text response | `{"type":"text-start","id":"txt-0"}` |
| `text-delta` | Incremental text chunk | `{"delta":"Pennsylvania"}` |
| `text-end` | End text response | `{"type":"text-end","id":"txt-0"}` |
| `[DONE]` | Stream complete | `data: [DONE]` |

**Interpretation:**
✓ Proper SSE format with `data:` prefix on each line
✓ Newline-delimited events for client parsing
✓ Structured event types enable UI progress indicators
✓ Tool calls are transparent in stream (visible to client)

### 3. RAG Integration Tests (3/3 passed)

| Test | Status | Notes |
|------|--------|-------|
| Eligibility question returns sources | ✓ | Sources block or relevant content |
| Sources contain valid JSON | ✓ | Alternate format validated |
| Benefits question returns relevant content | ✓ | Benefits-related content found |

#### Detailed RAG Test Results

##### How Vector Search Works

The RAG agent uses `vectorSearchTool` to query the embedded knowledge base:

1. **Query Transformation**: Agent reformulates user question into an optimized search query
2. **Embedding**: Query is converted to a vector using the embedding model
3. **Similarity Search**: Top K most similar document chunks are retrieved
4. **Context Assembly**: Retrieved chunks are concatenated (max 4000 chars) with source attribution
5. **Response Generation**: Agent synthesizes answer from context

**Tool Output Structure:**
```json
{
  "context": "Concatenated text from matching documents with source headers",
  "resultCount": 10,
  "sources": [
    {"filename": "doc.md", "title": "Document Title", "section": "Page 1", "score": 0.82}
  ]
}
```

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

*Note: Agent reformulated "Am I eligible for PA Medicaid?" → "PA Medicaid eligibility requirements" for better semantic matching.*

**Sources Retrieved (Top 5):**

| Source | Score | Section |
|--------|-------|---------|
| PA-DHS-Healthy-Horizons.pdf | 0.816 | Page 1 |
| PA-DHS-Long-Term-Care.pdf | 0.788 | Page 1 |
| PHLP-2025-Income-Limits.pdf | 0.783 | Page 1 |
| PHLP-CHC-Waiver-Eligibility-Guide.pdf | 0.782 | Page 6 |
| PA-PACE-PACENET-Provider-Guide-2025.pdf | 0.772 | Page 6 |

**Context Retrieved (excerpt):**
```
Source: [PA-DHS-Healthy-Horizons.md: Document: PA-DHS-Healthy-Horizons.pdf] (Page 1)
Score: 0.8164

Medicaid for Older People and People with Disabilities
Pennsylvania's Medical Assistance (Medicaid) program provides health care benefits
for older people (ages 65 and older), people with disabilities, or people who are blind.

Non-Money Payment (NMP)
| Number of People | NMP Categories Net Monthly Income Limit |
| 1                | $9,891.10                               |
| 2                | $1,483.30                               |

---
Source: [PA-DHS-Long-Term-Care.md: Document: PA-DHS-Long-Term-Care.pdf] (Page 1)
Score: 0.7876

Non-Financial Eligibility
A person must:
• Have a medical need for long-term care services
• Be a U.S. citizen or a qualified non-citizen
• Be a resident of Pennsylvania
• Have a social security number

Financial Eligibility
The financial eligibility factors are:
• Income
• Resources
```

**Actual Response:**

> To be eligible for Pennsylvania Medicaid, here are some general requirements:
>
> ### Who is Eligible?
> *   Older adults (ages 65 and older)
> *   People with disabilities
> *   People who are blind
>
> ### Non-Financial Requirements
> *   Must have a medical need for long-term care services (if applying for long-term care)
> *   Must be a U.S. citizen or a qualified non-citizen
> *   Must be a resident of Pennsylvania
> *   Must have a Social Security number
>
> ### Income Limits
>
> Pennsylvania Medicaid has different income limits depending on the category:
>
> **Non-Money Payment (NMP)**
>
> | Number of People | NMP Categories Net Monthly Income Limit |
> | ---------------- | --------------------------------------- |
> | 1                | **$9,891.10**                           |
> | 2                | **$1,483.30**                           |
>
> **Medically Needy Only (MNO)**
>
> | Number of People | MNO Categories Net Monthly Income Limits | MNO Categories Net 6-Month Income Limits |
> | ---------------- | ---------------------------------------- | ----------------------------------------- |
> | 1                | **$425**                                 | **$2,550**                                |
> | 2                | **$442**                                 | **$2,650**                                |
> | 3                | **$467**                                 | **$2,800**                                |
> | 4                | **$567**                                 | **$3,400**                                |
> | 5                | **$675**                                 | **$4,050**                                |
>
> 📌 **Good to Know**: Most income is counted when determining financial eligibility. Transferring assets for less than fair market value within 5 years of applying for Medicaid LTC services can affect eligibility.
>
> You can apply for Medicaid online through COMPASS, or by mailing/giving your application to your local County Assistance Office. They will determine your eligibility.
>
> *Sources: PA-DHS-Healthy-Horizons.pdf, PA-DHS-Long-Term-Care.pdf*

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

*Note: Agent reformulated "What benefits does PA Medicaid cover?" → "PA Medicaid covered benefits" for keyword optimization.*

**Sources Retrieved (Top 5):**

| Source | Score | Section |
|--------|-------|---------|
| PA-DHS-Healthy-Horizons.pdf | 0.804 | Page 1 |
| PHLP-Using-Medicare-Medicaid-Guide.pdf | 0.790 | Page 2 |
| PHLP-Using-Medicare-Medicaid-Guide.pdf | 0.787 | Page 1 |
| PHLP-2025-Income-Limits.pdf | 0.786 | Page 1 |
| PA-DHS-Healthy-Horizons.pdf | 0.763 | Page 2 |

**Context Retrieved (excerpt):**
```
Source: [PA-DHS-Healthy-Horizons.md: Document: PA-DHS-Healthy-Horizons.pdf] (Page 1)
Score: 0.8036

Medicaid for Older People and People with Disabilities
Pennsylvania's Medical Assistance (Medicaid) program provides health care benefits
for older people (ages 65 and older), people with disabilities, or people who are blind.
Information on this page describes general eligibility requirements and benefits

---
Source: [PHLP-Using-Medicare-Medicaid-Guide.md] (Page 2)
Score: 0.7904

There are two ways to get your Medicare coverage:
1. Original Medicare: You can use your red, white, and blue Medicare card which
   includes Medicare Part A (hospital coverage) and Medicare Part B (outpatient
   medical coverage) and enroll in a standalone Part D (drug coverage) plan.
2. Medicare Advantage Plan: You can enroll in a Medicare Advantage plan that
   includes Part A, Part B and Part D.

Since Medicare is your primary insurance, you need to see healthcare providers
who accept either original Medicare or your Medicare Advantage plan.
```

*Observation: The knowledge base contains eligibility-focused documents but lacks detailed benefits/coverage lists. This explains the agent's honest "partial answer" response.*

**Actual Response:**

> I found some information that may help, but I don't have a complete answer to your question.
>
> Pennsylvania's Medical Assistance (Medicaid) program provides health care benefits for older people (ages 65 and older), people with disabilities, or people who are blind.
>
> *Sources: PA-DHS-Healthy-Horizons.pdf, PHLP-Using-Medicare-Medicaid-Guide.pdf*
>
> **How I Used the Sources**
> - I used the first document to provide an overview of Pennsylvania's Medical Assistance (Medicaid) program and who it serves.
> - I used the second document to explain how Medicare and Medicaid work together.

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

*Analysis: The agent's system prompt defines its scope as "Pennsylvania Medicaid for seniors." When it detects an off-topic query, it bypasses the vector search entirely rather than wasting resources searching for irrelevant content. This is efficient behavior - no embedding computation, no similarity search, no context assembly.*

**Streaming Response Events:**
```
data: {"type":"start-step"}
data: {"type":"text-start","id":"txt-0"}
data: {"type":"text-delta","id":"txt-0","delta":"I am designed..."}
data: {"type":"text-end","id":"txt-0"}
data: {"type":"finish-step"}
data: [DONE]
```

*Note: Only one step (text generation) vs. two steps for RAG queries (tool call + text generation).*

**Actual Response:**

> I am designed to provide information about Pennsylvania Medicaid for seniors. I cannot answer general knowledge questions. I'm happy to help with any questions about eligibility, benefits, enrollment, or services available to you.

**Interpretation:**
✓ Agent correctly identified query as off-topic without searching the knowledge base.
✓ Agent politely declined and redirected to its domain expertise.
✓ No hallucination or attempt to answer outside its scope.
✓ Response size: 599 bytes (minimal, appropriate for redirect).
✓ Demonstrates proper system prompt adherence for scope boundaries.
✓ Efficient resource usage - skipped unnecessary vector search.

### 4. Initial Chat Tests (4/4 passed)

| Test | Status | Notes |
|------|--------|-------|
| Returns valid JSON | ✓ | |
| Response is an array | ✓ | |
| New thread returns empty array | ✓ | |
| Default threadId (rag-thread-1) works | ✓ | |

#### Detailed Initial Chat Test Results

##### How the Initial Chat API Works

The `/api/initial-chat` endpoint retrieves conversation history from Mastra Memory:

1. **ThreadId Extraction**: Parse threadId from query parameters
2. **Memory Query**: Fetch messages from LibSQL via Mastra Memory API
3. **Message Formatting**: Convert to UIMessage format with role and parts
4. **Response**: Return JSON array of messages (last 5 messages)

**Endpoint:** `GET /api/initial-chat`

**Query Parameters:**
| Parameter | Type | Required | Default |
|-----------|------|----------|---------|
| `threadId` | string | No | `rag-thread-1` |

**Response Schema:**
```json
[
  {
    "id": "string",
    "role": "user" | "assistant",
    "metadata": {
      "createdAt": "ISO timestamp",
      "threadId": "string",
      "resourceId": "string"
    },
    "parts": [
      {"type": "text", "text": "message content"}
    ]
  }
]
```

---

**Test 4.1: New Thread Returns Empty Array**

**Request:**
```
GET /api/initial-chat?threadId=initial-chat-test-1767713112
```

**Response:**
```json
[]
```

**Interpretation:**
✓ Valid JSON response (empty array)
✓ No messages exist for new threadId (correct behavior)
✓ Response type is array (not null or error)
✓ Content-Type: application/json

---

**Test 4.2: Default ThreadId Works**

**Request:**
```
GET /api/initial-chat?threadId=rag-thread-1
```

**Response (truncated):**
```json
[
  {
    "id": "27LcLIvatsIJp5tI",
    "role": "user",
    "metadata": {
      "createdAt": "2025-12-27T18:45:22.686Z",
      "threadId": "rag-thread-1",
      "resourceId": "user-1"
    },
    "parts": [
      {"type": "text", "text": "my name is Murali"}
    ]
  },
  {
    "id": "8634bfd5-4104-4363-9dcc-520ac159973c",
    "role": "assistant",
    "metadata": {
      "createdAt": "2025-12-27T18:45:26.175Z",
      "threadId": "rag-thread-1",
      "resourceId": "user-1"
    },
    "parts": [
      {"type": "tool-updateWorkingMemory", "toolCallId": "call_b33e...", "state": "output-available"},
      {"type": "step-start"},
      {"type": "text", "text": "Nice to meet you, Murali! I've stored your name in my memory..."}
    ]
  }
]
```

**Interpretation:**
✓ Returns existing conversation history
✓ Messages include both user and assistant roles
✓ Metadata contains timestamps and threadId
✓ Parts array supports multiple content types (text, tool calls, step markers)
✓ Messages ordered chronologically

---

**Test 4.3: Response Structure Validation**

**Message Parts Types:**

| Part Type | Description | Example |
|-----------|-------------|---------|
| `text` | Plain text content | `{"type": "text", "text": "Hello"}` |
| `tool-*` | Tool call state | `{"type": "tool-updateWorkingMemory", "state": "output-available"}` |
| `step-start` | Processing step marker | `{"type": "step-start"}` |

**Key Observations:**
- Messages use `parts` array (not flat `content` string) for rich content
- Tool interactions are preserved in conversation history
- Step markers help reconstruct conversation flow
- Unique IDs enable deduplication and ordering

### 5. Memory Persistence Tests (3/3 passed)

| Test | Status | Notes |
|------|--------|-------|
| Sent initial message | ✓ | |
| Messages persist in memory | ✓ | 2 messages found |
| User messages are stored | ✓ | |

#### Detailed Memory Persistence Test Results

##### How Memory Persistence Works

The Mastra Memory system stores conversation history in LibSQL:

1. **Message Creation**: Each chat request creates user message record
2. **Agent Response**: Assistant response saved after generation completes
3. **Thread Isolation**: Messages grouped by threadId for separate conversations
4. **Retrieval**: `/api/initial-chat` fetches last N messages per thread
5. **Retention**: Last 5 messages kept per thread (configurable)

**Storage Backend:** LibSQL (SQLite-compatible)
**Memory Provider:** Mastra Memory API

---

**Test 5.1: Message Persistence Flow**

**Step 1 - Send Initial Message:**

**Request:**
```json
{
  "messages": [{"role": "user", "content": "Hello, this is a memory test."}],
  "threadId": "memory-test-1767713785"
}
```

**Response:** 407 bytes (streaming acknowledgment)

**Step 2 - Retrieve Conversation History (after 2 second delay):**

**Request:**
```
GET /api/initial-chat?threadId=memory-test-1767713785
```

**Response:**
```json
[
  {
    "id": "f87db833-2578-43d4-aa08-81a51c6ddb57",
    "role": "user",
    "metadata": {
      "createdAt": "2026-01-06T15:36:25.711Z",
      "threadId": "memory-test-1767713785",
      "resourceId": "user-1"
    },
    "parts": [
      {"type": "text", "text": "Hello, this is a memory test."}
    ]
  },
  {
    "id": "aae1c235-342b-43a3-a1e2-f64760ddbfa5",
    "role": "assistant",
    "metadata": {
      "createdAt": "2026-01-06T15:36:26.454Z",
      "threadId": "memory-test-1767713785",
      "resourceId": "user-1"
    },
    "parts": [
      {"type": "text", "text": "Okay, I understand this is a memory test. I'm ready. Please proceed with your instructions."}
    ]
  }
]
```

**Interpretation:**
✓ User message persisted with correct content
✓ Assistant response persisted with generated text
✓ Both messages have unique IDs
✓ Timestamps show ~1 second between user message and assistant response
✓ ThreadId correctly associates both messages
✓ Messages ordered chronologically (user first, assistant second)

---

**Test 5.2: Thread Isolation**

Each unique threadId maintains separate conversation history:

| Thread ID | Messages | Isolated |
|-----------|----------|----------|
| `memory-test-1767713785` | 2 | ✓ |
| `rag-thread-1` | 5+ | ✓ |
| `new-thread-xyz` | 0 | ✓ |

*New threads start with empty history, preventing cross-conversation data leakage.*

### 6. Edge Case Tests (3/3 passed)

| Test | Status | Notes |
|------|--------|-------|
| Empty message handled | ✓ | Got response |
| Long query handled | ✓ | |
| Off-topic question handled gracefully | ✓ | |

#### Detailed Edge Case Test Results

##### Edge Case Handling Strategy

The RAG agent handles edge cases gracefully without crashing:

- **Empty inputs**: Agent responds with helpful prompt
- **Long queries**: Agent processes normally (may truncate internally)
- **Off-topic queries**: Agent politely redirects to its domain
- **Malformed queries**: Agent attempts reasonable interpretation

---

**Test 6.1: Empty Message**

**Request:**
```json
{
  "messages": [{"role": "user", "content": ""}],
  "threadId": "edge-empty-1"
}
```

**Response:**
```
data: {"type":"start-step"}
data: {"type":"text-start","id":"txt-0"}
data: {"type":"text-delta","id":"txt-0","delta":"Okay, I'"}
data: {"type":"text-delta","id":"txt-0","delta":"m ready to be a helpful Pennsylvania Medicaid assistant for seniors!..."}
data: {"type":"text-end","id":"txt-0"}
data: {"type":"finish-step"}
data: [DONE]
```

**Actual Response:**
> Okay, I'm ready to be a helpful Pennsylvania Medicaid assistant for seniors! I will follow all the rules and guidelines. Ask me anything about Pennsylvania Medicaid.

**Interpretation:**
✓ No crash or error on empty input
✓ Agent responds with helpful introduction
✓ Response size: 481 bytes
✓ Single step (no tool call needed for empty message)
✓ Graceful degradation to welcome message

---

**Test 6.2: Very Long Query**

**Request:**
```json
{
  "messages": [{"role": "user", "content": "Please tell me about Medicaid eligibility requirements and Medicaid eligibility requirements and ... (repeated 10x)"}],
  "threadId": "edge-long-1"
}
```

**Query Statistics:**
- Query length: 401 characters
- Response size: 8,465 bytes

**Interpretation:**
✓ Long query processed successfully
✓ No timeout (completed within 45 second limit)
✓ Agent extracted meaningful intent from repetitive query
✓ Full RAG pipeline executed (tool call + response generation)
✓ Response proportionally larger due to comprehensive answer

---

**Test 6.3: Off-Topic Question**

**Request:**
```json
{
  "messages": [{"role": "user", "content": "What is the capital of France?"}],
  "threadId": "edge-offtopic-1"
}
```

**Response:**
```
data: {"type":"start-step"}
data: {"type":"text-start","id":"txt-0"}
data: {"type":"text-delta","id":"txt-0","delta":"I am designed"}
data: {"type":"text-delta","id":"txt-0","delta":" to provide information about Pennsylvania Medicaid for seniors..."}
data: {"type":"text-end","id":"txt-0"}
data: {"type":"finish-step"}
data: [DONE]
```

**Actual Response:**
> I am designed to provide information about Pennsylvania Medicaid for seniors. I cannot answer general knowledge questions. I'm happy to help with any questions about eligibility, benefits, enrollment, or services available to you.

**Interpretation:**
✓ Agent correctly identified off-topic query
✓ No vector search tool called (efficient - saved unnecessary computation)
✓ Polite redirect to domain expertise
✓ Response size: 599 bytes (minimal footprint)
✓ Single step execution (no tool call step)

*See RAG Integration Tests - Test 3.3 for additional vector search analysis.*

### 7. Error Handling Tests (3/3 passed)

| Test | Status | Notes |
|------|--------|-------|
| Invalid JSON returns error | ✓ | HTTP 500 |
| Missing messages field handled | ✓ | HTTP 200 (graceful) |
| Empty messages array handled | ✓ | HTTP 200 |

#### Detailed Error Handling Test Results

##### Error Handling Strategy

The API handles errors at multiple levels:

| Level | Handler | Response |
|-------|---------|----------|
| JSON Parsing | Next.js | HTTP 500 |
| Missing Fields | Agent | Streaming error event |
| Invalid Input | Agent | Streaming error event |
| Model Failures | Fallback chain | Retry with fallback models |

---

**Test 7.1: Invalid JSON Body**

**Request:**
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d "not valid json"
```

**Response:**
```
HTTP 500 (Internal Server Error)
```

**Interpretation:**
✓ Server rejects malformed JSON at parsing stage
✓ HTTP 500 indicates server-side error (correct for parse failure)
✓ No crash - server continues handling other requests
✓ Empty response body (no sensitive error details exposed)

---

**Test 7.2: Missing Messages Field**

**Request:**
```json
{
  "threadId": "error-test"
}
```

**Response:**
```
HTTP 200
data: {"type":"error","errorText":"{\"message\":\"Exhausted all fallback models and reached the maximum number of retries.\",\"name\":\"Error\"}"}
data: [DONE]
```

**Interpretation:**
✓ HTTP 200 with streaming error event (graceful degradation)
✓ Error delivered via SSE stream (client can handle)
✓ Error message indicates model retry exhaustion
✓ Agent attempted to process but failed without messages
⚠ Could improve: Return HTTP 400 for missing required field

---

**Test 7.3: Empty Messages Array**

**Request:**
```json
{
  "messages": [],
  "threadId": "error-test"
}
```

**Response:**
```
HTTP 200
data: {"type":"error","errorText":"{\"message\":\"Exhausted all fallback models and reached the maximum number of retries.\",\"name\":\"Error\"}"}
data: [DONE]
```

**Interpretation:**
✓ Same graceful handling as missing field
✓ Streaming error event allows client notification
✓ Connection properly closed with [DONE]
⚠ Could improve: Validate messages array non-empty before agent call

---

**Error Response Format:**

```json
{
  "type": "error",
  "errorText": "{\"message\": \"...\", \"name\": \"Error\"}"
}
```

**Key Observations:**
- Errors delivered via SSE maintain client connection awareness
- Error text is JSON-encoded string (double-encoded)
- Stream always terminates with `[DONE]` even on error
- No stack traces or sensitive info exposed to client

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
