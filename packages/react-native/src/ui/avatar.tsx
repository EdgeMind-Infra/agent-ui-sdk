import { Image, type ImageProps, View, type ViewProps } from "react-native";
import { cn } from "../lib/utils";
import { Text } from "./text";

function Avatar({ className, ...props }: ViewProps) {
  return (
    <View
      className={cn("relative flex size-8 shrink-0 overflow-hidden rounded-full", className)}
      {...props}
    />
  );
}

function AvatarImage({ className, ...props }: ImageProps) {
  return <Image className={cn("aspect-square size-full", className)} {...props} />;
}

function AvatarFallback({
  className,
  children,
  ...props
}: ViewProps & { children?: React.ReactNode }) {
  return (
    <View
      className={cn(
        "bg-muted flex size-full flex-row items-center justify-center rounded-full",
        className,
      )}
      {...props}
    >
      {typeof children === "string" ? (
        <Text className="text-muted-foreground text-xs font-medium">{children}</Text>
      ) : (
        children
      )}
    </View>
  );
}

export { Avatar, AvatarFallback, AvatarImage };
