import { cva, type VariantProps } from "class-variance-authority";
import { Platform, Pressable } from "react-native";
import { cn, staticCn } from "../lib/utils";
import { TextClassContext } from "./text";

const buttonVariants = cva(
  staticCn(
    "group shrink-0 flex-row items-center justify-center gap-2 rounded-md shadow-none",
    Platform.select({
      web: "focus-visible:border-ring focus-visible:ring-ring/50 whitespace-nowrap outline-none transition-all focus-visible:ring-[3px] disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0",
    }),
  ),
  {
    variants: {
      variant: {
        default: staticCn(
          "bg-primary active:bg-primary/90 shadow-sm shadow-black/5",
          Platform.select({ web: "hover:bg-primary/90" }),
        ),
        destructive: staticCn(
          "bg-destructive active:bg-destructive/90 shadow-sm shadow-black/5",
          Platform.select({ web: "hover:bg-destructive/90" }),
        ),
        outline: staticCn(
          "border-border bg-background active:bg-accent border shadow-sm shadow-black/5",
          Platform.select({ web: "hover:bg-accent" }),
        ),
        secondary: staticCn(
          "bg-secondary active:bg-secondary/80 shadow-sm shadow-black/5",
          Platform.select({ web: "hover:bg-secondary/80" }),
        ),
        ghost: staticCn("active:bg-accent", Platform.select({ web: "hover:bg-accent" })),
        link: "",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 gap-1.5 rounded-md px-3",
        lg: "h-11 rounded-md px-6",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const buttonTextVariants = cva(
  staticCn(
    "text-foreground text-sm font-medium",
    Platform.select({ web: "pointer-events-none transition-colors" }),
  ),
  {
    variants: {
      variant: {
        default: "text-primary-foreground",
        destructive: "text-white",
        outline: staticCn(
          "group-active:text-accent-foreground",
          Platform.select({ web: "group-hover:text-accent-foreground" }),
        ),
        secondary: "text-secondary-foreground",
        ghost: "group-active:text-accent-foreground",
        link: staticCn(
          "text-primary group-active:underline",
          Platform.select({ web: "underline-offset-4 group-hover:underline" }),
        ),
      },
      size: {
        default: "",
        sm: "",
        lg: "",
        icon: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

type ButtonProps = React.ComponentProps<typeof Pressable> &
  React.RefAttributes<typeof Pressable> &
  VariantProps<typeof buttonVariants>;

function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <TextClassContext.Provider value={buttonTextVariants({ variant, size })}>
      <Pressable
        className={cn(props.disabled && "opacity-50", buttonVariants({ variant, size }), className)}
        role="button"
        {...props}
      />
    </TextClassContext.Provider>
  );
}

export { Button, buttonTextVariants, buttonVariants };
export type { ButtonProps };
