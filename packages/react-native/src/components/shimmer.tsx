import { memo, useEffect } from "react";
import { View } from "react-native";
import { cn } from "../lib/utils";
import { Text } from "../ui/text";

// Try to use Reanimated if available
let useSharedValue: ((init: number) => { value: number }) | null = null;
let useAnimatedStyle: ((cb: () => Record<string, unknown>) => Record<string, unknown>) | null =
  null;
let withRepeat: ((animation: unknown, count: number, reverse: boolean) => unknown) | null = null;
let withTiming: ((toValue: number, config?: Record<string, unknown>) => unknown) | null = null;
let AnimatedView: React.ComponentType<Record<string, unknown>> | null = null;

try {
  const Reanimated = require("react-native-reanimated");
  useSharedValue = Reanimated.useSharedValue;
  useAnimatedStyle = Reanimated.useAnimatedStyle;
  withRepeat = Reanimated.withRepeat;
  withTiming = Reanimated.withTiming;
  const Animated = require("react-native-reanimated").default;
  AnimatedView = Animated.View;
} catch {
  // Reanimated not available, use simple fallback
}

export interface ShimmerProps {
  text?: string;
  className?: string;
}

function ShimmerComponent({ text, className }: ShimmerProps) {
  if (useSharedValue && useAnimatedStyle && withRepeat && withTiming && AnimatedView) {
    return <AnimatedShimmer text={text} className={className} />;
  }

  // Fallback: simple pulsing text without animation
  return (
    <View className={cn("px-4 py-2", className)}>
      <Text className="text-muted-foreground text-sm">{text ?? "..."}</Text>
    </View>
  );
}

function AnimatedShimmer({ text, className }: ShimmerProps) {
  const opacity = useSharedValue!(0.3);

  useEffect(() => {
    opacity.value = withRepeat!(withTiming!(1, { duration: 1000 }), -1, true) as number;
  }, [opacity]);

  const animatedStyle = useAnimatedStyle!(() => ({
    opacity: opacity.value,
  }));

  const AView = AnimatedView!;

  return (
    <AView style={animatedStyle} className={cn("px-4 py-2", className)}>
      <Text className="text-muted-foreground text-sm">{text ?? "..."}</Text>
    </AView>
  );
}

export const Shimmer = memo(ShimmerComponent);
