"use client";

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--aui-radius)] text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--aui-ring)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--aui-primary)] text-[var(--aui-primary-foreground)] hover:bg-[var(--aui-primary)]/90",
        destructive:
          "bg-[var(--aui-destructive)] text-[var(--aui-destructive-foreground)] hover:bg-[var(--aui-destructive)]/90",
        outline:
          "border border-[var(--aui-border)] bg-[var(--aui-background)] hover:bg-[var(--aui-accent)] hover:text-[var(--aui-accent-foreground)]",
        secondary:
          "bg-[var(--aui-secondary)] text-[var(--aui-secondary-foreground)] hover:bg-[var(--aui-secondary)]/80",
        ghost: "hover:bg-[var(--aui-accent)] hover:text-[var(--aui-accent-foreground)]",
        link: "text-[var(--aui-primary)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-[calc(var(--aui-radius)-2px)] px-3 text-xs",
        lg: "h-10 rounded-[calc(var(--aui-radius)+2px)] px-8",
        icon: "size-9",
        "icon-sm": "size-7 rounded-[calc(var(--aui-radius)-2px)]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
