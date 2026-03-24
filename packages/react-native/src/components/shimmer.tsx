import { memo, useEffect } from "react";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { cn } from "../lib/utils";
import { Text } from "../ui/text";

export interface ShimmerProps {
  text?: string;
  className?: string;
}

function ShimmerComponent({ text, className }: ShimmerProps) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.set(withRepeat(withTiming(1, { duration: 1000 }), -1, true));
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.get(),
  }));

  return (
    <Animated.View style={animatedStyle} className={cn("px-4 py-2", className)}>
      <Text className="text-muted-foreground text-sm">{text ?? "..."}</Text>
    </Animated.View>
  );
}

export const Shimmer = memo(ShimmerComponent);
