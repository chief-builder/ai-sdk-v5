# Model Comparison Results

**Date**: 2026-01-07

## Test Configuration
- **Model A**: google/gemini-2.0-flash-001 (Gemini 2.0 Flash)
- **Model B**: x-ai/grok-4.1-fast (Grok 4.1 Fast)
- **Test Prompts**: 3
- **API Endpoint**: http://localhost:3000/api/chat

---

## Detailed Test Results

### Test 1: "What is PA Medicaid?"

#### Request
```json
{
  "messages": [{"role": "user", "content": "What is PA Medicaid?"}],
  "threadId": "test-thread-1",
  "model": "<MODEL_ID>"
}
```

#### Gemini 2.0 Flash

**Metrics:**
| Metric | Value |
|--------|-------|
| TTFB | 1.04s |
| Total Time | 2.41s |
| Tool Calls | 1 |
| Response Size | ~6.5KB |

**Tool Call:**
```json
{
  "query": "PA Medicaid definition",
  "topK": 5
}
```

**Response:**
```markdown
PA Medicaid, also known as Pennsylvania's Medical Assistance program, provides healthcare benefits
to older adults (ages 65 and older), people with disabilities, and people who are blind.

> 📌 **Good to Know**: There are different categories of Medicaid based on your income and needs.
Some categories provide full Medicaid coverage, while others help with Medicare costs.

Here are some of the Medicaid categories for seniors:

*   **Healthy Horizons (QMB Plus):** Provides full Medicaid coverage, including payment of Medicare
    Parts A and B monthly premiums, for people age 65+ and people with disabilities. Income limits
    for 2025 are **$1,304** single and **$1,763** married.
*   **Qualified Medicare Beneficiary (QMB):** Helps pay Medicare Parts A and B monthly premiums and
    cost-sharing. Income limits for 2025 are **$1,304** single and **$1,763** married.
*   **Specified Low-Income Medicare Beneficiary (SLMB):** Helps pay Medicare Part B monthly
    premiums. Income limits for 2025 are **$1,565** single and **$2,115** married.
*   **Qualified Individual (QI-1):** Helps pay Medicare Part B monthly premium. Income limits for
    2025 are **$1,761** single and **$2,380** married.

<sources>
[{"title": "Document: PA-DHS-Healthy-Horizons.pdf", "url": "./docs/PA-DHS-Healthy-Horizons.md"},
 {"title": "Document: PHLP-2025-Income-Limits.pdf", "url": "./docs/PHLP-2025-Income-Limits.md"}]
</sources>

**How I Used the Sources**
- PA-DHS-Healthy-Horizons.pdf: Used to define PA Medicaid and its purpose for older adults and
  those with disabilities.
- PHLP-2025-Income-Limits.pdf: Used to provide income limits and coverage details for different
  Medicaid categories (Healthy Horizons, QMB, SLMB, QI-1).
```

---

#### Grok 4.1 Fast

**Metrics:**
| Metric | Value |
|--------|-------|
| TTFB | 0.63s |
| Total Time | 40.64s |
| Tool Calls | 1 |
| Response Size | ~32.7KB |

**Reasoning (Think Aloud):**
```
The user asked: "What is PA Medicaid?"

## Investigating user query
- The user wants to know, "What is PA Medicaid?"
- This seems to be about Pennsylvania's health care program, likely related to Medicaid.
```

**Tool Call:**
```json
{
  "query": "What is PA Medicaid Pennsylvania Medical Assistance overview",
  "topK": 10
}
```

**Response:**
```markdown
### What is PA Medicaid?

Hello! PA Medicaid, also called **Pennsylvania's Medical Assistance program**, helps pay for health
care. It's for older adults (like those **65 and older**), people with disabilities, and people who
are blind.

This program covers important health services so you don't have to worry as much about big medical
bills.

> 📌 **Good to Know**: It includes different categories based on your income and needs, like
Non-Money Payment (NMP) or Medically Needy Only (MNO).

### Quick Look at Income Guidelines
These are some net monthly income limits from the info I found (they can change, so check for
updates):

**Non-Money Payment (NMP)**:
| Number of People | Monthly Income Limit |
|------------------|----------------------|
| 1                | **$989.10**          |
| 2                | **$1,483.30**        |

**Medically Needy Only (MNO)**:
| Number of People | Monthly Income Limit | 6-Month Income Limit |
|------------------|----------------------|----------------------|
| 1                | **$425**             | **$2,550**           |
| 2                | **$442**             | **$2,650**           |

> ⚠️ **Important**: These are general guidelines. Your eligibility depends on income, assets, and
other factors. Always verify with the state.

### Next Steps
- **Apply online** at [COMPASS](https://www.compass.state.pa.us).
- **Call** the PA Department of Human Services: **1-800-692-7462** (they can explain more).
- Visit your local County Assistance Office for in-person help.

> 📞 **Need Help?**: The helpline is friendly and can guide you step by step. I'm here if you have
more questions about benefits or eligibility!

<sources>
[{"title": "Document: PA-DHS-Healthy-Horizons.pdf", "url": "./docs/PA-DHS-Healthy-Horizons.md"}]
</sources>

**How I Used the Sources**
- Document: PA-DHS-Healthy-Horizons.pdf: Used for the definition of PA Medicaid (Medical
  Assistance), who it's for, and income limit examples.
```

---

### Test 2: "Am I eligible for PA Medicaid if I make $1,500 a month?"

#### Request
```json
{
  "messages": [{"role": "user", "content": "Am I eligible for PA Medicaid if I make $1,500 a month?"}],
  "threadId": "test-thread-2",
  "model": "<MODEL_ID>"
}
```

| Metric | Gemini 2.0 Flash | Grok 4.1 Fast |
|--------|------------------|---------------|
| TTFB | 21.91s | 3.22s |
| Total Time | 25.19s | 60.00s (timeout) |
| Tool Calls | 1 | 1 |
| Response Size | ~8.1KB | ~37.9KB |

**Key Differences:**
- Gemini: Single focused search, concise response with income limits
- Grok: More thorough search query, detailed eligibility breakdown with tables

---

### Test 3: "What dental services does PA Medicaid cover?"

#### Request
```json
{
  "messages": [{"role": "user", "content": "What dental services does PA Medicaid cover?"}],
  "threadId": "test-thread-3",
  "model": "<MODEL_ID>"
}
```

| Metric | Gemini 2.0 Flash | Grok 4.1 Fast |
|--------|------------------|---------------|
| TTFB | 28.25s | 0.73s |
| Total Time | 50.75s | 60.00s (timeout) |
| Tool Calls | 1 | 3 |
| Response Size | ~7.8KB | ~42.9KB |

**Key Differences:**
- Gemini: 1 search, standard benefits list
- Grok: 3 searches (iterative refinement), comprehensive coverage with provider info

---

## Performance Summary

| Metric | Gemini 2.0 Flash | Grok 4.1 Fast | Winner |
|--------|------------------|---------------|--------|
| Avg TTFB | 17.07s | 1.53s | **Grok** |
| Avg Total Time | 26.12s | 53.55s | **Gemini** |
| Tool Call Success | 3/3 (100%) | 3/3 (100%) | Tie |
| Avg Response Size | ~7.5KB | ~37.8KB | - |

---

## Response Quality Comparison

### Search Strategy

| Aspect | Gemini 2.0 Flash | Grok 4.1 Fast |
|--------|------------------|---------------|
| Query Style | Short, keyword-focused | Natural language, comprehensive |
| Example | `"PA Medicaid definition"` | `"What is PA Medicaid Pennsylvania Medical Assistance overview"` |
| topK Setting | 5 | 10 |
| Iterative Searches | No (single search) | Yes (up to 3 searches when needed) |

### Response Formatting

| Aspect | Gemini 2.0 Flash | Grok 4.1 Fast |
|--------|------------------|---------------|
| Greeting | None | Yes ("Hello!") |
| Headers | Uses `*` bullet lists | Uses `###` markdown headers |
| Tables | Inline lists | Proper markdown tables |
| Callouts | Uses `>` blocks | Uses `>` blocks with emojis |
| Next Steps | Sometimes included | Always included with contact info |
| Tone | Professional, direct | Warm, conversational |

### Information Depth

| Aspect | Gemini 2.0 Flash | Grok 4.1 Fast |
|--------|------------------|---------------|
| Detail Level | Moderate | High |
| Income Tables | Inline text | Formatted tables |
| Action Items | Sometimes | Always (Apply, Call, Visit) |
| Phone Numbers | When in source | Always included |
| Follow-up Offer | Rarely | Always ("I'm here if you have more questions") |

---

## Key Observations

### Grok 4.1 Fast
- **Faster time-to-first-token (TTFB)** - Starts responding almost immediately (~1.5s avg vs ~17s)
- **Generates longer, more detailed responses** (~5x more content)
- **Uses more tool calls** when appropriate (Test 3: 3 searches vs 1)
- **Slower total completion** due to longer responses (hit 60s timeout on 2 tests)
- **2M context window** - better for complex, multi-turn conversations
- **Warmer tone** - greetings, follow-up offers, more conversational
- **Better tables** - properly formatted markdown tables

### Gemini 2.0 Flash
- **Faster total completion** - More concise responses
- **Consistent tool calling** - Always exactly 1 search
- **Variable TTFB** - Sometimes slow to start (up to 28s)
- **More predictable response length**
- **More direct tone** - gets straight to the information

---

## Recommendations

| Use Case | Recommended Model | Reason |
|----------|-------------------|--------|
| Quick, concise answers | Gemini 2.0 Flash | Faster completion, shorter responses |
| Detailed, comprehensive responses | Grok 4.1 Fast | More thorough, better formatting |
| Real-time streaming UX (fast start) | Grok 4.1 Fast | Much faster TTFB |
| Total response time critical | Gemini 2.0 Flash | Completes in ~26s vs ~54s |
| Complex multi-step research | Grok 4.1 Fast | Multiple tool calls, deeper analysis |
| Long conversation history | Grok 4.1 Fast | 2M context window |
| Senior-friendly responses | Grok 4.1 Fast | Warmer tone, better tables, action items |
| Cost-sensitive applications | Gemini 2.0 Flash | Shorter responses = fewer tokens |

---

## Cost Comparison (via OpenRouter)

| Model | Input (per 1M tokens) | Output (per 1M tokens) |
|-------|----------------------|------------------------|
| Gemini 2.0 Flash | ~$0.10 | ~$0.40 |
| Grok 4.1 Fast | ~$0.20 | ~$0.50 |

**Estimated Cost per Query:**
- Gemini: ~$0.003 per query (shorter responses)
- Grok: ~$0.015 per query (5x longer responses)

*Note: Grok generates ~5x more tokens per response, so actual cost per query is approximately 5x higher.*

---

## Conclusion

Both models work well with the RAG system and produce high-quality, senior-friendly responses.

**Choose Gemini 2.0 Flash when:**
- Total response time is critical
- Cost efficiency is important
- You need predictable, concise responses

**Choose Grok 4.1 Fast when:**
- User experience (fast start) matters more than total time
- You need comprehensive, detailed answers
- The application involves long conversations or complex queries
- A warmer, more conversational tone is preferred

**For this PA Medicaid assistant specifically:** Grok 4.1 Fast may be better suited due to its warmer tone, better table formatting, and consistent inclusion of next steps and phone numbers - all important for the senior target audience.
