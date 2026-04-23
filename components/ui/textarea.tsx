"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    className={cn("cosmic-input min-h-[80px]", className)}
    ref={ref}
    {...props}
  />
));
Textarea.displayName = "Textarea";
