"use client";

import { UIMessage, useChat } from "@ai-sdk/react";
import useSWR from "swr";
import { useState, useEffect, useCallback, useRef } from "react";
import { CopyIcon, CheckIcon, RefreshCcwIcon, HeartHandshakeIcon } from "lucide-react";
import { AppHeader } from "@/src/components/app-header";

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/src/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
  MessageActions,
  MessageAction,
} from "@/src/components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
  PromptInputSubmit,
  PromptInputActionMenu,
  PromptInputActionMenuTrigger,
  PromptInputActionMenuContent,
  PromptInputActionAddAttachments,
  PromptInputHeader,
  PromptInputAttachments,
  PromptInputAttachment,
  PromptInputSelect,
  PromptInputSelectTrigger,
  PromptInputSelectContent,
  PromptInputSelectItem,
  PromptInputSelectValue,
} from "@/src/components/ai-elements/prompt-input";
import {
  Sources,
  SourcesTrigger,
  SourcesContent,
  Source,
} from "@/src/components/ai-elements/sources";
import {
  Reasoning,
  ReasoningTrigger,
  ReasoningContent,
} from "@/src/components/ai-elements/reasoning";
import { Loader } from "@/src/components/ai-elements/loader";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Model options for the selector
// Note: Only Gemini 2.0 Flash is enabled - other free models don't reliably support
// tool calling in streaming mode via OpenRouter. The prompt infrastructure supports
// multiple models when they become available (see src/mastra/prompts/).
const models = [
  { id: "google/gemini-2.0-flash-001", name: "Gemini 2.0 Flash" },
];

// Extract sources from message parts and inline citations
type SourceItem = { title: string; url: string };

// Regex patterns for parsing sources - flexible to handle various whitespace/newline patterns
const SOURCES_BLOCK_PATTERN = /<sources>[\s\S]*?<\/sources>/gi;
const SOURCES_JSON_PATTERN = /<sources>\s*```json\s*([\s\S]*?)```\s*<\/sources>/gi;
const INLINE_SOURCE_PATTERN = /\[Source:\s*([^\]]+)\]/g;
const HOW_I_USED_PATTERN = /\*\*How I Used the Sources\*\*[\s\S]*?(?=\n\n|$)/gi;

function extractSources(message: UIMessage): SourceItem[] {
  const sources: SourceItem[] = [];
  const seenUrls = new Set<string>();

  // Check for source-url parts (AI SDK v5 format)
  message.parts.forEach((part) => {
    if (part.type === "source-url") {
      const sourcePart = part as { type: "source-url"; url: string; title?: string };
      if (!seenUrls.has(sourcePart.url)) {
        seenUrls.add(sourcePart.url);
        sources.push({ title: sourcePart.title || sourcePart.url, url: sourcePart.url });
      }
    }
  });

  // Get full text content
  const text = message.parts
    .filter((part) => part.type === "text")
    .map((part) => (part as { type: "text"; text: string }).text)
    .join("");

  // Parse <sources>```json[...]```</sources> blocks (new prompt format)
  const blockMatches = text.matchAll(new RegExp(SOURCES_JSON_PATTERN.source, "gi"));
  for (const blockMatch of blockMatches) {
    try {
      const jsonStr = blockMatch[1].trim();
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed)) {
        for (const src of parsed) {
          if (src.url && !seenUrls.has(src.url)) {
            seenUrls.add(src.url);
            sources.push({ title: src.title || src.url, url: src.url });
          }
        }
      }
    } catch {
      // JSON parsing failed, ignore this block
    }
  }

  // Fallback: parse inline [Source: filename] citations from text
  const inlineMatches = text.matchAll(new RegExp(INLINE_SOURCE_PATTERN.source, "g"));
  for (const match of inlineMatches) {
    const filename = match[1].trim();
    if (!seenUrls.has(filename)) {
      seenUrls.add(filename);
      sources.push({ title: filename, url: "#" });
    }
  }

  return sources;
}

// Strip sources blocks from displayed text (handles both complete and incomplete/streaming blocks)
function stripSourcesFromText(text: string): string {
  return text
    // Remove complete <sources>...</sources> blocks
    .replace(new RegExp(SOURCES_BLOCK_PATTERN.source, "gi"), "")
    // Remove incomplete/streaming <sources> blocks (tag started but not closed yet)
    .replace(/<sources>[\s\S]*$/gi, "")
    // Remove any standalone <sources> or </sources> tags that might remain
    .replace(/<\/?sources>/gi, "")
    .replace(new RegExp(HOW_I_USED_PATTERN.source, "gi"), "")
    .trim();
}

// Get text content from message parts (with sources stripped for display)
function getMessageText(message: UIMessage, stripSources: boolean = true): string {
  const text = message.parts
    .filter((part) => part.type === "text")
    .map((part) => (part as { type: "text"; text: string }).text)
    .join("");

  return stripSources ? stripSourcesFromText(text) : text;
}

// Extract reasoning content from message parts
type ReasoningItem = { text: string; toolCalls?: { name: string; input: string }[] };

function extractReasoning(message: UIMessage): ReasoningItem | null {
  const reasoningParts: string[] = [];
  const toolCalls: { name: string; input: string }[] = [];

  message.parts.forEach((part) => {
    // Handle reasoning parts (AI SDK v5 format)
    if (part.type === "reasoning") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const reasoningPart = part as any;
      const text = reasoningPart.reasoning || reasoningPart.text || "";
      if (text) {
        reasoningParts.push(text);
      }
    }
    // Handle tool invocations to show what the model searched for
    if (part.type.startsWith("tool-")) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const toolPart = part as any;
      // AI SDK v5 tool parts have input directly on the part
      const toolName = toolPart.toolName;
      const input = toolPart.input;
      if (toolName === "vectorSearchTool" && input?.query) {
        toolCalls.push({
          name: "Search",
          input: input.query as string
        });
      }
    }
  });

  // Return reasoning if we have any content
  if (reasoningParts.length > 0 || toolCalls.length > 0) {
    return {
      text: reasoningParts.join("\n"),
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
    };
  }

  return null;
}

export default function Chat() {
  const threadId = useRef(crypto.randomUUID()).current;
  const [selectedModel, setSelectedModel] = useState(models[0].id);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: initialMessages = [] } = useSWR<UIMessage[]>(
    `/api/initial-chat?threadId=${threadId}`,
    fetcher
  );

  const { messages, sendMessage, status, setMessages, regenerate } = useChat();

  useEffect(() => {
    if (initialMessages.length > 0) {
      setMessages(initialMessages);
    }
  }, [initialMessages, setMessages]);

  const handleSubmit = useCallback(
    (data: { text: string; files: unknown[] }) => {
      if (data.text.trim()) {
        sendMessage({ text: data.text }, { body: { threadId, model: selectedModel } });
      }
    },
    [sendMessage, threadId, selectedModel]
  );

  const handleCopy = useCallback((text: string, messageId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(messageId);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const handleRetry = useCallback(() => {
    regenerate({ body: { threadId, model: selectedModel } });
  }, [regenerate, threadId, selectedModel]);

  const isLoading = status === "submitted" || status === "streaming";

  // Suggested questions for empty state
  const suggestedQuestions = [
    "Am I eligible for PA Medicaid?",
    "What benefits does PA Medicaid cover?",
    "What documents do I need to apply?",
    "How do I apply for Medicaid in PA?",
  ];

  const handleSuggestedQuestion = useCallback(
    (question: string) => {
      sendMessage({ text: question }, { body: { threadId, model: selectedModel } });
    },
    [sendMessage, threadId, selectedModel]
  );

  return (
    <div className="flex flex-col h-screen bg-background">
      <AppHeader />
      <div className="flex flex-col flex-1 overflow-hidden">
          <Conversation className="flex-1">
        <ConversationContent className="px-6 py-8">
          {messages.length === 0 ? (
            <ConversationEmptyState
              title="Welcome to PA Medicaid Helper"
              description="I'm here to help you understand Pennsylvania Medicaid, check your eligibility, and guide you through the application process."
              icon={<HeartHandshakeIcon className="size-10" />}
            >
              <div className="text-primary p-4 bg-primary/10 rounded-full mb-1">
                <HeartHandshakeIcon className="size-10" />
              </div>
              <div className="space-y-2 mb-4">
                <h2 className="font-display font-semibold text-2xl text-foreground">
                  Welcome to PA Medicaid Helper
                </h2>
                <p className="text-muted-foreground text-base max-w-md">
                  I&apos;m here to help you understand Pennsylvania Medicaid, check your eligibility, and guide you through the application process.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 max-w-lg w-full">
                {suggestedQuestions.map((question) => (
                  <button
                    key={question}
                    onClick={() => handleSuggestedQuestion(question)}
                    className="px-4 py-3 text-left rounded-lg bg-card border-2 border-border hover:border-primary hover:bg-secondary/50 transition-colors text-sm font-medium min-h-touch focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </ConversationEmptyState>
          ) : (
            messages.map((message) => {
              const text = getMessageText(message);
              const sources = message.role === "assistant" ? extractSources(message) : [];
              const reasoning = message.role === "assistant" ? extractReasoning(message) : null;

              return (
                <div key={message.id}>
                  <Message from={message.role}>
                    <MessageContent>
                      {/* Show reasoning/tool calls before the response */}
                      {message.role === "assistant" && reasoning && (
                        <Reasoning>
                          <ReasoningTrigger />
                          <ReasoningContent>
                            {reasoning.toolCalls && reasoning.toolCalls.length > 0 && (
                              <div className="space-y-1">
                                {reasoning.toolCalls.map((tool, idx) => (
                                  <div key={idx} className="flex items-center gap-2">
                                    <span className="text-primary font-medium">{tool.name}:</span>
                                    <span className="italic">&quot;{tool.input}&quot;</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            {reasoning.text && (
                              <p className="mt-2 whitespace-pre-wrap">{reasoning.text}</p>
                            )}
                          </ReasoningContent>
                        </Reasoning>
                      )}
                      <MessageResponse>{text}</MessageResponse>
                      {message.role === "assistant" && sources.length > 0 && (
                        <Sources>
                          <SourcesTrigger count={sources.length} />
                          <SourcesContent>
                            {sources.map((source, idx) => (
                              <Source
                                key={idx}
                                href={source.url}
                                title={source.title}
                                index={idx + 1}
                              />
                            ))}
                          </SourcesContent>
                        </Sources>
                      )}
                      {message.role === "assistant" && (
                        <MessageActions>
                          <MessageAction
                            label={copiedId === message.id ? "Copied!" : "Copy"}
                            tooltip={copiedId === message.id ? "Copied to clipboard" : "Copy response"}
                            onClick={() => handleCopy(text, message.id)}
                          >
                            {copiedId === message.id ? (
                              <CheckIcon className="size-4 text-green-500" />
                            ) : (
                              <CopyIcon className="size-4" />
                            )}
                          </MessageAction>
                          <MessageAction
                            label="Retry"
                            tooltip="Regenerate response"
                            onClick={handleRetry}
                          >
                            <RefreshCcwIcon className="size-4" />
                          </MessageAction>
                        </MessageActions>
                      )}
                    </MessageContent>
                  </Message>
                </div>
              );
            })
          )}
          {isLoading && <Loader size={24} />}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="border-t-2 border-border bg-card p-6">
        <PromptInput onSubmit={handleSubmit} globalDrop multiple>
          <PromptInputHeader>
            <PromptInputAttachments>
              {(attachment) => (
                <PromptInputAttachment data={attachment} />
              )}
            </PromptInputAttachments>
          </PromptInputHeader>
          <PromptInputBody>
            <PromptInputTextarea
              placeholder="Ask me about PA Medicaid benefits, eligibility, or applications..."
              disabled={isLoading}
            />
          </PromptInputBody>
          <PromptInputFooter>
            <PromptInputTools>
              <PromptInputActionMenu>
                <PromptInputActionMenuTrigger />
                <PromptInputActionMenuContent>
                  <PromptInputActionAddAttachments />
                </PromptInputActionMenuContent>
              </PromptInputActionMenu>
              <PromptInputSelect
                value={selectedModel}
                onValueChange={setSelectedModel}
              >
                <PromptInputSelectTrigger>
                  <PromptInputSelectValue />
                </PromptInputSelectTrigger>
                <PromptInputSelectContent>
                  {models.map((model) => (
                    <PromptInputSelectItem key={model.id} value={model.id} className="py-3 text-base">
                      {model.name}
                    </PromptInputSelectItem>
                  ))}
                </PromptInputSelectContent>
              </PromptInputSelect>
            </PromptInputTools>
            <PromptInputSubmit status={status} disabled={isLoading} />
          </PromptInputFooter>
        </PromptInput>
          </div>
      </div>
    </div>
  );
}
