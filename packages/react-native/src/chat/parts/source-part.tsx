import { useCallback } from "react";
import { Linking, Pressable, View } from "react-native";
import type { SourcePartProps } from "../../types";
import { Text } from "../../ui/text";

function SourceItem({ url, title }: { url: string; title?: string }) {
  const handlePress = useCallback(() => {
    Linking.openURL(url);
  }, [url]);

  return (
    <Pressable
      className="bg-muted active:bg-accent flex-row items-center gap-2 rounded-md px-3 py-2"
      onPress={handlePress}
    >
      <Text className="text-primary text-sm" numberOfLines={1}>
        {title ?? url}
      </Text>
    </Pressable>
  );
}

export function SourcePart({ sources }: SourcePartProps) {
  if (sources.length === 0) return null;

  return (
    <View className="my-1 gap-1">
      <Text className="text-muted-foreground text-xs font-medium">
        {sources.length} source{sources.length > 1 ? "s" : ""}
      </Text>
      {sources.map((source) => (
        <SourceItem key={source.sourceId} url={source.url} title={source.title} />
      ))}
    </View>
  );
}
