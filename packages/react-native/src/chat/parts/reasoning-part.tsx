import { useEffect, useState } from "react";
import { View } from "react-native";
import type { ReasoningPartProps } from "../../types";
import { Button } from "../../ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../../ui/collapsible";
import { Text } from "../../ui/text";

export function ReasoningPart({ text, isStreaming }: ReasoningPartProps) {
  const [open, setOpen] = useState(isStreaming);

  // Auto-expand during streaming, collapse when done
  useEffect(() => {
    if (isStreaming) {
      setOpen(true);
    }
  }, [isStreaming]);

  return (
    <View className="my-1">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="flex-row items-center gap-2 px-0">
            <View className="bg-muted-foreground/30 size-4 items-center justify-center rounded-full">
              <Text className="text-muted-foreground text-[10px]">💭</Text>
            </View>
            <Text className="text-muted-foreground text-sm">
              {isStreaming ? "Thinking..." : "Thinking"}
            </Text>
            <Text className="text-muted-foreground text-xs">{open ? "▲" : "▼"}</Text>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <View className="border-muted ml-2 mt-1 border-l-2 pl-3">
            <Text className="text-muted-foreground text-sm leading-6">{text}</Text>
          </View>
        </CollapsibleContent>
      </Collapsible>
    </View>
  );
}
