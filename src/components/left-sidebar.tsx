"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CheckCircle2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClipboardListIcon,
  FileTextIcon,
  UserCheckIcon,
} from "lucide-react";
import { useState, useEffect, type ComponentProps } from "react";

export type LeftSidebarProps = ComponentProps<"aside"> & {
  onQuickAction?: (action: string) => void;
};

const quickActions = [
  {
    id: "eligibility",
    label: "Check My Eligibility",
    icon: UserCheckIcon,
    prompt: "Am I eligible for PA Medicaid? What are the requirements?",
  },
  {
    id: "application",
    label: "Start Application",
    icon: ClipboardListIcon,
    prompt: "How do I start a PA Medicaid application? Walk me through the process.",
  },
  {
    id: "documents",
    label: "Upload Documents",
    icon: FileTextIcon,
    prompt: "What documents do I need to apply for PA Medicaid?",
  },
];

const progressSteps = [
  { id: 1, label: "Eligibility", completed: false },
  { id: 2, label: "Documents", completed: false },
  { id: 3, label: "Application", completed: false },
  { id: 4, label: "Review", completed: false },
];

export const LeftSidebar = ({
  className,
  onQuickAction,
  ...props
}: LeftSidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("leftSidebarCollapsed");
    if (stored === "true") {
      setIsCollapsed(true);
    }
  }, []);

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("leftSidebarCollapsed", String(newState));
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <aside
        className={cn(
          "hidden lg:flex flex-col w-64 border-r-2 border-border bg-card p-4 gap-6 overflow-y-auto",
          className
        )}
        {...props}
      />
    );
  }

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "hidden lg:flex flex-col border-r-2 border-border bg-card overflow-y-auto transition-all duration-300",
          isCollapsed ? "w-16 p-2" : "w-64 p-4 gap-6",
          className
        )}
        {...props}
      >
        {/* Toggle Button */}
        <div className={cn("flex", isCollapsed ? "justify-center" : "justify-end")}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleCollapse}
                className="size-8"
              >
                {isCollapsed ? (
                  <ChevronRightIcon className="size-4" />
                ) : (
                  <ChevronLeftIcon className="size-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Quick Actions */}
        <section className={cn(isCollapsed && "flex flex-col items-center gap-2")}>
          {!isCollapsed && (
            <h2 className="font-display font-semibold text-base text-foreground mb-3">
              Quick Actions
            </h2>
          )}
          <div className={cn("flex flex-col", isCollapsed ? "gap-2" : "gap-2")}>
            {quickActions.map((action) =>
              isCollapsed ? (
                <Tooltip key={action.id}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-10"
                      onClick={() => onQuickAction?.(action.prompt)}
                    >
                      <action.icon className="size-5 text-primary" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">{action.label}</TooltipContent>
                </Tooltip>
              ) : (
                <Button
                  key={action.id}
                  variant="outline"
                  className="justify-start gap-3 h-auto py-3 px-4 text-left min-h-touch"
                  onClick={() => onQuickAction?.(action.prompt)}
                >
                  <action.icon className="size-5 text-primary shrink-0" />
                  <span className="text-sm font-medium">{action.label}</span>
                </Button>
              )
            )}
          </div>
        </section>

        {/* Progress Tracker - Hidden when collapsed */}
        {!isCollapsed && (
          <section>
            <h2 className="font-display font-semibold text-base text-foreground mb-3">
              Your Progress
            </h2>
            <div className="flex flex-col gap-1">
              {progressSteps.map((step) => (
                <div key={step.id} className="flex items-center gap-3 py-2">
                  <div
                    className={cn(
                      "flex items-center justify-center size-7 rounded-full text-sm font-medium shrink-0",
                      step.completed
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground border-2 border-border"
                    )}
                  >
                    {step.completed ? (
                      <CheckCircle2Icon className="size-4" />
                    ) : (
                      step.id
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-sm",
                      step.completed
                        ? "text-foreground font-medium"
                        : "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Progress is saved as you complete each step
            </p>
          </section>
        )}

        {/* Help text - Hidden when collapsed */}
        {!isCollapsed && (
          <section className="mt-auto pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Need help? Just ask me any question about PA Medicaid benefits,
              eligibility, or the application process.
            </p>
          </section>
        )}
      </aside>
    </TooltipProvider>
  );
};
