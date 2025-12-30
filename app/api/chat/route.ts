import { mastra } from "@/src/mastra";
import { toAISdkStream } from "@mastra/ai-sdk";
import { createUIMessageStreamResponse } from "ai";

const ragAgent = mastra.getAgent("ragAgent");

export async function POST(req: Request) {
  const { messages, threadId } = await req.json();

  const stream = await ragAgent.stream(messages, {
    threadId: threadId || "rag-thread-1",
    resourceId: "user-1",
  });

  const aiSdkStream = toAISdkStream(stream, {
    from: "agent",
    sendReasoning: true,
    sendSources: true,
  });

  return createUIMessageStreamResponse({ stream: aiSdkStream });
}
