"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowDownIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { useCallback } from "react";
import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom";

export type ConversationProps = ComponentProps<typeof StickToBottom>;

export const Conversation = ({ className, ...props }: ConversationProps) => (
  <StickToBottom
    className={cn("relative flex-1 overflow-y-hidden", className)}
    initial="smooth"
    resize="smooth"
    role="log"
    {...props}
  />
);

export type ConversationContentProps = ComponentProps<
  typeof StickToBottom.Content
>;

export const ConversationContent = ({
  className,
  ...props
}: ConversationContentProps) => (
  <StickToBottom.Content
    className={cn("flex flex-col gap-6 p-6", className)}
    {...props}
  />
);

export type ConversationEmptyStateProps = ComponentProps<"div"> & {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
};

export const ConversationEmptyState = ({
  className,
  title = "Hi! How can I help you today?",
  description = "Ask me anything about PACE benefits",
  icon,
  children,
  ...props
}: ConversationEmptyStateProps) => (
  <div
    className={cn(
      "flex size-full flex-col items-center justify-center gap-6 p-8 text-center",
      className
    )}
    {...props}
  >
    {children ?? (
      <>
        {icon && (
          <div className="text-primary p-4 bg-primary/10 rounded-full">
            {icon}
          </div>
        )}
        <div className="space-y-3">
          <h2 className="font-display font-semibold text-3xl text-foreground">{title}</h2>
          {description && (
            <p className="text-muted-foreground text-lg max-w-md">{description}</p>
          )}
        </div>
      </>
    )}
  </div>
);

export type ConversationScrollButtonProps = ComponentProps<typeof Button>;

export const ConversationScrollButton = ({
  className,
  ...props
}: ConversationScrollButtonProps) => {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();

  const handleScrollToBottom = useCallback(() => {
    scrollToBottom();
  }, [scrollToBottom]);

  return (
    !isAtBottom && (
      <Button
        className={cn(
          "absolute bottom-4 left-[50%] translate-x-[-50%] rounded-full shadow-warm-lg min-h-touch-lg min-w-touch-lg",
          className
        )}
        onClick={handleScrollToBottom}
        size="icon-lg"
        type="button"
        variant="secondary"
        {...props}
      >
        <ArrowDownIcon className="size-6" />
        <span className="sr-only">Scroll to bottom</span>
      </Button>
    )
  );
};
