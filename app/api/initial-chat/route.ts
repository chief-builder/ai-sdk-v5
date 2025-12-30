import { mastra } from "@/src/mastra";
import { toAISdkV5Messages } from "@mastra/ai-sdk/ui";
import { NextResponse } from "next/server";

const ragAgent = mastra.getAgent("ragAgent");

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const threadId = searchParams.get("threadId") || "rag-thread-1";

  const memory = await ragAgent.getMemory();
  const result = await memory?.recall({
    threadId,
  });

  const messages = toAISdkV5Messages(result?.messages || []);
  return NextResponse.json(messages);
}
