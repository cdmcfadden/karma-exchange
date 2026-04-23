"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "btn-brass",
        secondary:
          "border border-[var(--glass-edge)] bg-[var(--glass)] text-[var(--text)] hover:border-[var(--brass)] hover:text-[var(--brass-bright)]",
        outline:
          "btn-ghost",
        ghost:
          "bg-transparent text-[var(--text-dim)] hover:text-[var(--brass-bright)] hover:bg-[rgba(232,212,168,0.06)]",
        destructive:
          "border border-[var(--err)] bg-[rgba(201,123,168,0.1)] text-[var(--err)] hover:bg-[rgba(201,123,168,0.2)]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  ),
);
Button.displayName = "Button";
