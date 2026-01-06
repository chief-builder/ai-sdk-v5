import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { vectorSearchTool } from '../tools/vector-search-tool';
import { buildInstructionsForModel } from '../prompts';

/**
 * RAG Agent with dynamic model-specific instructions.
 * The instructions are determined at runtime based on the model ID
 * passed via requestContext from the API route.
 */
export const ragAgent = new Agent({
  id: 'rag-agent',
  name: 'PA Medicaid Assistant',
  instructions: async ({ requestContext }) => {
    // Get model ID from requestContext (Map-like object passed by API route)
    const rawModelId = requestContext?.get?.('modelId');
    const modelId: string = typeof rawModelId === 'string' ? rawModelId : 'google/gemini-2.0-flash-001';
    console.log(`[RAG Agent] Using prompt for model: ${modelId}`);
    return buildInstructionsForModel(modelId);
  },
  // model: 'lmstudio/openai/gpt-oss-20b',
  model: {
    id: "openrouter/google/gemini-2.0-flash-001",
    url: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
  },
  
  tools: { vectorSearchTool },
  memory: new Memory({
    options: {
      lastMessages: 5,
    },
  }),
});


