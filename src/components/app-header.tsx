"use client";

import { HeartHandshakeIcon, PhoneIcon, ExternalLinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

export type AppHeaderProps = ComponentProps<"header">;

export const AppHeader = ({ className, ...props }: AppHeaderProps) => (
  <header
    className={cn(
      "sticky top-0 z-50 flex items-center justify-between gap-4 px-6 py-4 bg-card border-b-2 border-border shadow-sm",
      className
    )}
    {...props}
  >
    <div className="flex items-center gap-3">
      <div className="p-2 bg-primary/10 rounded-xl">
        <HeartHandshakeIcon className="size-8 text-primary" />
      </div>
      <div>
        <h1 className="font-display font-bold text-xl text-foreground leading-tight">
          PA Medicaid Helper
        </h1>
        <p className="text-sm text-muted-foreground">
          Your guide to Pennsylvania Medicaid
        </p>
      </div>
    </div>

    {/* Essential Contact Info - Senior-friendly quick access */}
    <div className="flex items-center gap-4">
      <a
        href="tel:1-800-692-7462"
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors min-h-touch"
      >
        <PhoneIcon className="size-5 text-primary" />
        <span className="text-base font-medium text-foreground">1-800-692-7462</span>
      </a>
      <a
        href="https://www.dhs.pa.gov"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors min-h-touch"
      >
        <ExternalLinkIcon className="size-5 text-primary" />
        <span className="text-base font-medium text-foreground">PA DHS</span>
      </a>
    </div>
  </header>
);
