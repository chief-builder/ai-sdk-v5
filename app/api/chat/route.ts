import { mastra } from "@/src/mastra";
import { toAISdkStream } from "@mastra/ai-sdk";
import { createUIMessageStreamResponse } from "ai";

const ragAgent = mastra.getAgent("ragAgent");

export async function POST(req: Request) {
  const { messages, threadId, model } = await req.json();

  // Determine the model ID (use provided model or default)
  const modelId = model || "google/gemini-2.0-flash-001";

  // Build stream options with requestContext for dynamic instructions
  // requestContext must be a Map for Mastra's agent instructions function
  const requestContext = new Map<string, string>();
  requestContext.set("modelId", modelId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const streamOptions: any = {
    threadId: threadId || "rag-thread-1",
    resourceId: "user-1",
    requestContext,
  };

  // Override model if different from default
  if (model) {
    streamOptions.model = {
      id: `openrouter/${model}`,
      url: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY,
    };
  }

  const stream = await ragAgent.stream(messages, streamOptions);

  const aiSdkStream = toAISdkStream(stream, {
    from: "agent",
    sendReasoning: true,
    sendSources: true,
  });

  return createUIMessageStreamResponse({ stream: aiSdkStream });
}
