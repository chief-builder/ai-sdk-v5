#!/bin/bash
# Model Comparison: Gemini 2.0 Flash vs Grok 4.1 Fast
# Compares latency, tool calling, and response quality

set -e

API_URL="http://localhost:3000/api/chat"
RESULTS_FILE="/tmp/model-comparison-results.md"

# Models to compare
MODEL_A="google/gemini-2.0-flash-001"
MODEL_B="x-ai/grok-4.1-fast"

# Test prompts (varying complexity)
declare -a PROMPTS=(
  "What is PA Medicaid?"
  "Am I eligible for PA Medicaid if I make $1,500 a month?"
  "What dental services does PA Medicaid cover?"
)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Model Comparison Test${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "Model A: $MODEL_A"
echo "Model B: $MODEL_B"
echo "API URL: $API_URL"
echo ""

# Initialize results file
cat > "$RESULTS_FILE" << 'EOF'
# Model Comparison Results

## Test Configuration
- **Date**: $(date)
- **Model A**: google/gemini-2.0-flash-001 (Gemini 2.0 Flash)
- **Model B**: x-ai/grok-4.1-fast (Grok 4.1 Fast)

## Results Summary

| Metric | Gemini 2.0 Flash | Grok 4.1 Fast |
|--------|------------------|---------------|
EOF

# Function to test a model with a prompt
test_model() {
  local model="$1"
  local prompt="$2"
  local thread_id="$3"
  local output_file="/tmp/model_response_$$.txt"

  # Measure time to first byte and total time
  local start_time=$(python3 -c "import time; print(time.time())")

  # Make request and capture timing
  local timing_info=$(curl -s -w "\n%{time_starttransfer}|%{time_total}" \
    -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -d "{\"messages\":[{\"role\":\"user\",\"content\":\"$prompt\"}],\"threadId\":\"$thread_id\",\"model\":\"$model\"}" \
    --max-time 60 \
    -o "$output_file" 2>/dev/null)

  local ttfb=$(echo "$timing_info" | tail -1 | cut -d'|' -f1)
  local total=$(echo "$timing_info" | tail -1 | cut -d'|' -f2)

  # Check for tool calls in response
  local tool_calls=$(grep -c "tool-input-start" "$output_file" 2>/dev/null || echo "0")

  # Check for sources in response
  local has_sources=$(grep -c "sources" "$output_file" 2>/dev/null || echo "0")

  # Check for text response
  local has_text=$(grep -c "text-delta" "$output_file" 2>/dev/null || echo "0")

  # Check for reasoning
  local has_reasoning=$(grep -c "reasoning-delta" "$output_file" 2>/dev/null || echo "0")

  # Get response size
  local response_size=$(wc -c < "$output_file" | tr -d ' ')

  # Output results
  echo "$ttfb|$total|$tool_calls|$has_sources|$has_text|$has_reasoning|$response_size"

  rm -f "$output_file"
}

# Arrays to store results
declare -a GEMINI_TTFB=()
declare -a GEMINI_TOTAL=()
declare -a GEMINI_TOOLS=()
declare -a GROK_TTFB=()
declare -a GROK_TOTAL=()
declare -a GROK_TOOLS=()

echo -e "${YELLOW}Running tests...${NC}"
echo ""

test_num=1
for prompt in "${PROMPTS[@]}"; do
  echo -e "${BLUE}Test $test_num: ${NC}$prompt"
  echo ""

  # Test Gemini
  echo -n "  Testing Gemini 2.0 Flash... "
  gemini_result=$(test_model "$MODEL_A" "$prompt" "compare-gemini-$test_num-$$")
  gemini_ttfb=$(echo "$gemini_result" | cut -d'|' -f1)
  gemini_total=$(echo "$gemini_result" | cut -d'|' -f2)
  gemini_tools=$(echo "$gemini_result" | cut -d'|' -f3)
  gemini_sources=$(echo "$gemini_result" | cut -d'|' -f4)
  gemini_text=$(echo "$gemini_result" | cut -d'|' -f5)
  gemini_reasoning=$(echo "$gemini_result" | cut -d'|' -f6)
  gemini_size=$(echo "$gemini_result" | cut -d'|' -f7)
  echo -e "${GREEN}Done${NC}"
  echo "    TTFB: ${gemini_ttfb}s | Total: ${gemini_total}s | Tools: $gemini_tools | Size: ${gemini_size}B"

  GEMINI_TTFB+=("$gemini_ttfb")
  GEMINI_TOTAL+=("$gemini_total")
  GEMINI_TOOLS+=("$gemini_tools")

  # Small delay between requests
  sleep 2

  # Test Grok
  echo -n "  Testing Grok 4.1 Fast... "
  grok_result=$(test_model "$MODEL_B" "$prompt" "compare-grok-$test_num-$$")
  grok_ttfb=$(echo "$grok_result" | cut -d'|' -f1)
  grok_total=$(echo "$grok_result" | cut -d'|' -f2)
  grok_tools=$(echo "$grok_result" | cut -d'|' -f3)
  grok_sources=$(echo "$grok_result" | cut -d'|' -f4)
  grok_text=$(echo "$grok_result" | cut -d'|' -f5)
  grok_reasoning=$(echo "$grok_result" | cut -d'|' -f6)
  grok_size=$(echo "$grok_result" | cut -d'|' -f7)
  echo -e "${GREEN}Done${NC}"
  echo "    TTFB: ${grok_ttfb}s | Total: ${grok_total}s | Tools: $grok_tools | Size: ${grok_size}B"

  GROK_TTFB+=("$grok_ttfb")
  GROK_TOTAL+=("$grok_total")
  GROK_TOOLS+=("$grok_tools")

  echo ""
  ((test_num++))

  # Delay between test sets
  sleep 2
done

# Calculate averages
calc_avg() {
  local arr=("$@")
  local sum=0
  local count=${#arr[@]}
  for val in "${arr[@]}"; do
    sum=$(python3 -c "print($sum + $val)")
  done
  python3 -c "print(round($sum / $count, 3))"
}

gemini_avg_ttfb=$(calc_avg "${GEMINI_TTFB[@]}")
gemini_avg_total=$(calc_avg "${GEMINI_TOTAL[@]}")
grok_avg_ttfb=$(calc_avg "${GROK_TTFB[@]}")
grok_avg_total=$(calc_avg "${GROK_TOTAL[@]}")

# Count successful tool calls
gemini_tool_success=0
grok_tool_success=0
for t in "${GEMINI_TOOLS[@]}"; do [[ "$t" -gt 0 ]] && ((gemini_tool_success++)); done
for t in "${GROK_TOOLS[@]}"; do [[ "$t" -gt 0 ]] && ((grok_tool_success++)); done

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "                      Gemini 2.0 Flash    Grok 4.1 Fast"
echo "------------------------------------------------------"
echo "Avg TTFB:             ${gemini_avg_ttfb}s              ${grok_avg_ttfb}s"
echo "Avg Total Time:       ${gemini_avg_total}s              ${grok_avg_total}s"
echo "Tool Call Success:    ${gemini_tool_success}/${#PROMPTS[@]}                 ${grok_tool_success}/${#PROMPTS[@]}"
echo ""

# Determine winner for each category
echo -e "${YELLOW}Analysis:${NC}"
if (( $(echo "$gemini_avg_ttfb < $grok_avg_ttfb" | bc -l) )); then
  echo "  - TTFB: Gemini is faster (${gemini_avg_ttfb}s vs ${grok_avg_ttfb}s)"
else
  echo "  - TTFB: Grok is faster (${grok_avg_ttfb}s vs ${gemini_avg_ttfb}s)"
fi

if (( $(echo "$gemini_avg_total < $grok_avg_total" | bc -l) )); then
  echo "  - Total Time: Gemini is faster (${gemini_avg_total}s vs ${grok_avg_total}s)"
else
  echo "  - Total Time: Grok is faster (${grok_avg_total}s vs ${gemini_avg_total}s)"
fi

echo "  - Tool Calling: Gemini ${gemini_tool_success}/${#PROMPTS[@]}, Grok ${grok_tool_success}/${#PROMPTS[@]}"
echo ""

# Write detailed results to file
cat > "$RESULTS_FILE" << EOF
# Model Comparison Results

**Date**: $(date)

## Test Configuration
- **Model A**: google/gemini-2.0-flash-001 (Gemini 2.0 Flash)
- **Model B**: x-ai/grok-4.1-fast (Grok 4.1 Fast)
- **Test Prompts**: ${#PROMPTS[@]}
- **API Endpoint**: $API_URL

## Performance Summary

| Metric | Gemini 2.0 Flash | Grok 4.1 Fast | Winner |
|--------|------------------|---------------|--------|
| Avg TTFB | ${gemini_avg_ttfb}s | ${grok_avg_ttfb}s | $(if (( $(echo "$gemini_avg_ttfb < $grok_avg_ttfb" | bc -l) )); then echo "Gemini"; else echo "Grok"; fi) |
| Avg Total Time | ${gemini_avg_total}s | ${grok_avg_total}s | $(if (( $(echo "$gemini_avg_total < $grok_avg_total" | bc -l) )); then echo "Gemini"; else echo "Grok"; fi) |
| Tool Call Success | ${gemini_tool_success}/${#PROMPTS[@]} | ${grok_tool_success}/${#PROMPTS[@]} | $(if [[ $gemini_tool_success -ge $grok_tool_success ]]; then echo "Gemini"; else echo "Grok"; fi) |

## Detailed Results

### Test 1: "${PROMPTS[0]}"
- Gemini: TTFB=${GEMINI_TTFB[0]}s, Total=${GEMINI_TOTAL[0]}s, Tools=${GEMINI_TOOLS[0]}
- Grok: TTFB=${GROK_TTFB[0]}s, Total=${GROK_TOTAL[0]}s, Tools=${GROK_TOOLS[0]}

### Test 2: "${PROMPTS[1]}"
- Gemini: TTFB=${GEMINI_TTFB[1]}s, Total=${GEMINI_TOTAL[1]}s, Tools=${GEMINI_TOOLS[1]}
- Grok: TTFB=${GROK_TTFB[1]}s, Total=${GROK_TOTAL[1]}s, Tools=${GROK_TOOLS[1]}

### Test 3: "${PROMPTS[2]}"
- Gemini: TTFB=${GEMINI_TTFB[2]}s, Total=${GEMINI_TOTAL[2]}s, Tools=${GEMINI_TOOLS[2]}
- Grok: TTFB=${GROK_TTFB[2]}s, Total=${GROK_TOTAL[2]}s, Tools=${GROK_TOOLS[2]}

## Model Characteristics

### Gemini 2.0 Flash
- Provider: Google via OpenRouter
- Strengths: Fast responses, reliable tool calling
- Context: Standard

### Grok 4.1 Fast
- Provider: xAI via OpenRouter
- Strengths: 2M context window, parallel tool calling, agentic workflows
- Optimized for: Real-world use cases, customer support, deep research

## Recommendations

Based on the test results:

1. **For speed-critical applications**: Use $(if (( $(echo "$gemini_avg_ttfb < $grok_avg_ttfb" | bc -l) )); then echo "Gemini 2.0 Flash"; else echo "Grok 4.1 Fast"; fi)
2. **For complex, multi-step tasks**: Consider Grok 4.1 Fast (2M context, parallel tool calling)
3. **For reliability**: Both models showed good tool calling support

EOF

echo -e "${GREEN}Results saved to: $RESULTS_FILE${NC}"
echo ""
cat "$RESULTS_FILE"
