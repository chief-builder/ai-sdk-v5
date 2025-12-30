"use client";

import { UIMessage, useChat } from "@ai-sdk/react";
import useSWR from "swr";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { CopyIcon, RefreshCcwIcon, MessageSquareIcon } from "lucide-react";

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

// Extract sources from message parts (AI SDK v5 uses source-url parts)
type SourceItem = { title: string; url: string };

function extractSources(message: UIMessage): SourceItem[] {
  const sources: SourceItem[] = [];
  message.parts.forEach((part) => {
    if (part.type === "source-url") {
      const sourcePart = part as { type: "source-url"; url: string; title?: string };
      sources.push({
        title: sourcePart.title || sourcePart.url,
        url: sourcePart.url,
      });
    }
  });
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

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
  }, []);

  const handleRetry = useCallback(() => {
    regenerate({ body: { threadId } });
  }, [regenerate, threadId]);

  const isLoading = status === "submitted" || status === "streaming";

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto">
      <Conversation className="flex-1">
        <ConversationContent className="px-4 py-6">
          {messages.length === 0 ? (
            <ConversationEmptyState
              title="Start a conversation"
              description="Ask a question to get started"
              icon={<MessageSquareIcon className="size-8" />}
            />
          ) : (
            messages.map((message) => {
              const text = getMessageText(message);
              const sources = message.role === "assistant" ? extractSources(message) : [];

              return (
                <div key={message.id} className="space-y-2">
                  <Message from={message.role}>
                    <MessageContent>
                      <MessageResponse>{text}</MessageResponse>
                    </MessageContent>
                    {message.role === "assistant" && (
                      <MessageActions>
                        <MessageAction
                          tooltip="Copy"
                          onClick={() => handleCopy(text)}
                        >
                          <CopyIcon className="size-3.5" />
                        </MessageAction>
                        <MessageAction
                          tooltip="Retry"
                          onClick={handleRetry}
                        >
                          <RefreshCcwIcon className="size-3.5" />
                        </MessageAction>
                      </MessageActions>
                    )}
                  </Message>

                  {sources.length > 0 && (
                    <Sources className="ml-0">
                      <SourcesTrigger count={sources.length} />
                      <SourcesContent>
                        {sources.map((source, idx) => (
                          <Source
                            key={idx}
                            href={source.url}
                            title={source.title}
                          />
                        ))}
                      </SourcesContent>
                    </Sources>
                  )}
                </div>
              );
            })
          )}
          {isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader size={16} />
              <span className="text-sm">Thinking...</span>
            </div>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="border-t bg-background p-4">
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
              placeholder="Ask a question..."
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
                <PromptInputSelectTrigger className="w-auto gap-1 text-xs">
                  <PromptInputSelectValue />
                </PromptInputSelectTrigger>
                <PromptInputSelectContent>
                  {models.map((model) => (
                    <PromptInputSelectItem key={model.id} value={model.id}>
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
