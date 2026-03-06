import { View } from "react-native";
import type { TextPartProps } from "../../types";
import { Text } from "../../ui/text";

let StreamdownRN: React.ComponentType<{ children: string }> | null = null;
try {
  // Optional peer dependency
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  StreamdownRN = require("streamdown-rn").StreamdownRN;
} catch {
  // streamdown-rn not installed, fallback to plain Text
}

export function TextPart({ text }: TextPartProps) {
  if (StreamdownRN) {
    return (
      <View className="flex-1">
        <StreamdownRN>{text}</StreamdownRN>
      </View>
    );
  }

  return <Text className="text-foreground text-base leading-7">{text}</Text>;
}
