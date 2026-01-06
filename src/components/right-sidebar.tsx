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
  ChevronLeftIcon,
  ChevronRightIcon,
  ExternalLinkIcon,
  PhoneIcon,
  MapPinIcon,
  GlobeIcon,
  HelpCircleIcon,
} from "lucide-react";
import { useState, useEffect, type ComponentProps } from "react";

export type RightSidebarProps = ComponentProps<"aside"> & {
  onHelpTopic?: (topic: string) => void;
};

const importantLinks = [
  {
    id: "dhs",
    label: "PA DHS Website",
    url: "https://www.dhs.pa.gov",
    icon: GlobeIcon,
  },
  {
    id: "compass",
    label: "COMPASS Portal",
    url: "https://www.compass.state.pa.us",
    icon: ExternalLinkIcon,
    description: "Online application portal",
  },
  {
    id: "cao",
    label: "Find Local Office",
    url: "https://www.dhs.pa.gov/Services/Assistance/Pages/CAO-Contact.aspx",
    icon: MapPinIcon,
  },
];

const helpTopics = [
  {
    id: "eligibility",
    label: "Eligibility Requirements",
    prompt: "What are the eligibility requirements for PA Medicaid?",
  },
  {
    id: "benefits",
    label: "Covered Benefits",
    prompt: "What benefits and services does PA Medicaid cover?",
  },
  {
    id: "documents",
    label: "Required Documents",
    prompt: "What documents do I need to apply for PA Medicaid?",
  },
  {
    id: "process",
    label: "Application Process",
    prompt: "Walk me through the PA Medicaid application process step by step.",
  },
];

export const RightSidebar = ({
  className,
  onHelpTopic,
  ...props
}: RightSidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(true); // Default collapsed
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("rightSidebarCollapsed");
    // Only expand if explicitly set to false
    if (stored === "false") {
      setIsCollapsed(false);
    }
  }, []);

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("rightSidebarCollapsed", String(newState));
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <aside
        className={cn(
          "hidden xl:flex flex-col w-16 border-l-2 border-border bg-card p-2 overflow-y-auto",
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
          "hidden xl:flex flex-col border-l-2 border-border bg-card overflow-y-auto transition-all duration-300",
          isCollapsed ? "w-16 p-2" : "w-56 p-4 gap-6",
          className
        )}
        {...props}
      >
        {/* Toggle Button */}
        <div className={cn("flex", isCollapsed ? "justify-center" : "justify-start")}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleCollapse}
                className="size-8"
              >
                {isCollapsed ? (
                  <ChevronLeftIcon className="size-4" />
                ) : (
                  <ChevronRightIcon className="size-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              {isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Important Links */}
        <section className={cn(isCollapsed && "flex flex-col items-center gap-2")}>
          {!isCollapsed && (
            <h2 className="font-display font-semibold text-base text-foreground mb-3">
              Important Links
            </h2>
          )}
          <div className={cn("flex flex-col", isCollapsed ? "gap-2" : "gap-2")}>
            {importantLinks.map((link) =>
              isCollapsed ? (
                <Tooltip key={link.id}>
                  <TooltipTrigger asChild>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center size-10 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                    >
                      <link.icon className="size-5 text-primary" />
                    </a>
                  </TooltipTrigger>
                  <TooltipContent side="left">{link.label}</TooltipContent>
                </Tooltip>
              ) : (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors min-h-touch"
                >
                  <link.icon className="size-5 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-foreground block">
                      {link.label}
                    </span>
                    {link.description && (
                      <span className="text-xs text-muted-foreground">
                        {link.description}
                      </span>
                    )}
                  </div>
                  <ExternalLinkIcon className="size-4 text-muted-foreground shrink-0" />
                </a>
              )
            )}
          </div>
        </section>

        {/* Help Topics */}
        <section className={cn(isCollapsed && "flex flex-col items-center gap-2")}>
          {!isCollapsed && (
            <h2 className="font-display font-semibold text-base text-foreground mb-3 flex items-center gap-2">
              <HelpCircleIcon className="size-4" />
              Help Topics
            </h2>
          )}
          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-10"
                  onClick={toggleCollapse}
                >
                  <HelpCircleIcon className="size-5 text-primary" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">Help Topics</TooltipContent>
            </Tooltip>
          ) : (
            <div className="flex flex-col gap-1">
              {helpTopics.map((topic) => (
                <Button
                  key={topic.id}
                  variant="ghost"
                  className="justify-start h-auto py-2.5 px-3 text-left text-sm min-h-touch"
                  onClick={() => onHelpTopic?.(topic.prompt)}
                >
                  {topic.label}
                </Button>
              ))}
            </div>
          )}
        </section>

        {/* Contact Info */}
        <section className={cn(
          "mt-auto pt-4 border-t border-border",
          isCollapsed && "flex flex-col items-center"
        )}>
          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <a
                  href="tel:1-800-692-7462"
                  className="flex items-center justify-center size-10 rounded-lg hover:bg-secondary transition-colors"
                >
                  <PhoneIcon className="size-5 text-primary" />
                </a>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p className="font-medium">1-800-692-7462</p>
                <p className="text-xs text-muted-foreground">Mon-Fri, 8am-5pm</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <>
              <h2 className="font-display font-semibold text-sm text-foreground mb-2">
                Need More Help?
              </h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <PhoneIcon className="size-4 text-primary" />
                <span>1-800-692-7462</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                PA DHS Helpline: Mon-Fri, 8am-5pm
              </p>
            </>
          )}
        </section>
      </aside>
    </TooltipProvider>
  );
};
