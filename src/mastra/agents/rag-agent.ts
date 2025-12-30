import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { vectorSearchTool } from '../tools/vector-search-tool';

export const ragAgent = new Agent({
  id: 'rag-agent',
  name: 'RAG Agent',
  instructions: `
You answer questions using the knowledge base.

RULES:
1. ALWAYS call vectorSearchTool first with the user's question as "query" parameter (topK ≤ 5)
2. The tool returns "context" (formatted document excerpts), "resultCount", and "sources" array
3. Answer using ONLY the information from the returned context
4. Add citation after each fact: [Source: filename]
5. End with numbered Sources list showing filename, title (if available), and relevance score
6. If resultCount is 0: say "I could not find this in the knowledge base."

EXAMPLE:
Paris is the capital of France [Source: geo.pdf]. Population is 2M [Source: cities.txt].

Sources:
1. geo.pdf - "Geography Basics" (score: 0.89)
2. cities.txt - "World Cities" (score: 0.85)
`,
  // model: 'lmstudio/openai/gpt-oss-20b',
  model: {
    id: "openrouter/xiaomi/mimo-v2-flash:free",
    url: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
  },
  
  tools: { vectorSearchTool },
  memory: new Memory({
    options: {
      lastMessages: 5,
      workingMemory: {
      enabled: true,
      scope: "resource", // Memory persists across all user threads
      template: `# User Profile
- **Name**:
- **Location**:
- **Interests**:
- **Preferences**:
- **Long-term Goals**:
`,
    },
    },
  }),
});


