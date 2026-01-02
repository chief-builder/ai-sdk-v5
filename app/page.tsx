"use client";

import { UIMessage, useChat } from "@ai-sdk/react";
import useSWR from "swr";
import { useState, useEffect, useCallback, useRef } from "react";
import { CopyIcon, CheckIcon, RefreshCcwIcon, HeartHandshakeIcon } from "lucide-react";

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
import { Loader } from "@/src/components/ai-elements/loader";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Model options for the selector (UI-only for now)
const models = [
  { id: "xiaomi/mimo-v2-flash:free", name: "Mimo v2 Flash" },
  { id: "google/gemini-flash-1.5", name: "Gemini Flash 1.5" },
  { id: "anthropic/claude-3-haiku", name: "Claude 3 Haiku" },
];

// Extract sources from message parts and inline citations
type SourceItem = { title: string; url: string };

function extractSources(message: UIMessage): SourceItem[] {
  const sources: SourceItem[] = [];
  const seenTitles = new Set<string>();

  // Check for source-url parts (AI SDK v5 format)
  message.parts.forEach((part) => {
    if (part.type === "source-url") {
      const sourcePart = part as { type: "source-url"; url: string; title?: string };
      const title = sourcePart.title || sourcePart.url;
      if (!seenTitles.has(title)) {
        seenTitles.add(title);
        sources.push({ title, url: sourcePart.url });
      }
    }
  });

  // Also parse inline [Source: filename] citations from text
  const text = message.parts
    .filter((part) => part.type === "text")
    .map((part) => (part as { type: "text"; text: string }).text)
    .join("");

  const sourceRegex = /\[Source:\s*([^\]]+)\]/g;
  let match;
  while ((match = sourceRegex.exec(text)) !== null) {
    const filename = match[1].trim();
    if (!seenTitles.has(filename)) {
      seenTitles.add(filename);
      sources.push({ title: filename, url: "#" });
    }
  }

  return sources;
}

// Get text content from message parts
function getMessageText(message: UIMessage): string {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => (part as { type: "text"; text: string }).text)
    .join("");
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
        sendMessage({ text: data.text }, { body: { threadId } });
      }
    },
    [sendMessage, threadId]
  );

  const handleCopy = useCallback((text: string, messageId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(messageId);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const handleRetry = useCallback(() => {
    regenerate({ body: { threadId } });
  }, [regenerate, threadId]);

  const isLoading = status === "submitted" || status === "streaming";

  // Suggested questions for empty state
  const suggestedQuestions = [
    "What is PACE?",
    "Am I eligible for PACE?",
    "What benefits does PACE cover?",
    "How do I apply?",
  ];

  const handleSuggestedQuestion = useCallback(
    (question: string) => {
      sendMessage({ text: question }, { body: { threadId } });
    },
    [sendMessage, threadId]
  );

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-background">
      <Conversation className="flex-1">
        <ConversationContent className="px-6 py-8">
          {messages.length === 0 ? (
            <ConversationEmptyState
              title="Hi! How can I help you today?"
              description="Ask me anything about PACE benefits"
              icon={<HeartHandshakeIcon className="size-10" />}
            >
              <div className="text-primary p-4 bg-primary/10 rounded-full mb-1">
                <HeartHandshakeIcon className="size-10" />
              </div>
              <div className="space-y-2 mb-4">
                <h2 className="font-display font-semibold text-2xl text-foreground">
                  Hi! How can I help you today?
                </h2>
                <p className="text-muted-foreground text-base max-w-md">
                  Ask me anything about PACE benefits
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

              return (
                <div key={message.id}>
                  <Message from={message.role}>
                    <MessageContent>
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
              placeholder="Type your question here..."
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
  );
}
