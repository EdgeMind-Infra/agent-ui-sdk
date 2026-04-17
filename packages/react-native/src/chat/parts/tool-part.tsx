import type { ComponentType } from "react";
import { useState, useSyncExternalStore } from "react";
import { View } from "react-native";
import { cn } from "../../lib/utils";
import type { ToolPartProps, ToolUIProps } from "../../types";
import { Button } from "../../ui/button";
import { Card, CardContent, CardHeader } from "../../ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../../ui/collapsible";
import { Text } from "../../ui/text";
import { useChatContext } from "../chat-provider";

export function ToolPart({ part, messageId, partIndex }: ToolPartProps) {
  const { toolUIRegistry, toolRenderers } = useChatContext();
  const toolName = part.toolName ?? part.type.replace("tool-", "");

  // Check registry for custom renderer
  const registrySnapshot = useSyncExternalStore(
    toolUIRegistry.subscribe,
    toolUIRegistry.getSnapshot,
  );
  const CustomRenderer = (registrySnapshot[toolName] ?? toolRenderers?.[toolName]) as
    | ComponentType<ToolUIProps>
    | undefined;

  if (CustomRenderer) {
    return (
      <CustomRenderer
        input={part.input}
        output={part.output}
        state={part.state}
        toolCallId={part.toolCallId}
        toolName={toolName}
        messageId={messageId}
        partIndex={partIndex}
      />
    );
  }

  return <DefaultToolPart part={part} messageId={messageId} partIndex={partIndex} />;
}

function DefaultToolPart({ part }: ToolPartProps) {
  const [open, setOpen] = useState(false);
  const isError = part.state === "result" && !!part.errorText;
  const isLoading =
    part.state === "call" || part.state === "input-streaming" || part.state === "input-available";
  const toolName = part.toolName ?? part.type.replace("tool-", "");

  return (
    <Card className={cn("my-1", isError && "border-destructive")}>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CardHeader className="py-3">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full flex-row justify-start gap-2 px-0">
              <View
                className={cn(
                  "size-2 rounded-full",
                  isLoading && "bg-muted-foreground animate-pulse",
                  !isLoading && !isError && "bg-green-500",
                  isError && "bg-destructive",
                )}
              />
              <Text className="text-sm font-medium">{toolName}</Text>
              <Text className="text-muted-foreground ml-auto text-xs">{open ? "▲" : "▼"}</Text>
            </Button>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="gap-2 py-0 pb-4">
            {part.input != null && (
              <View className="bg-muted rounded-md p-3">
                <Text className="text-muted-foreground text-xs font-medium">Input</Text>
                <Text className="mt-1 font-mono text-xs">
                  {typeof part.input === "string"
                    ? part.input
                    : JSON.stringify(part.input, null, 2)}
                </Text>
              </View>
            )}
            {part.output != null && (
              <View className="bg-muted rounded-md p-3">
                <Text className="text-muted-foreground text-xs font-medium">Output</Text>
                <Text className="mt-1 font-mono text-xs">
                  {typeof part.output === "string"
                    ? part.output
                    : JSON.stringify(part.output, null, 2)}
                </Text>
              </View>
            )}
            {part.errorText && (
              <View className="bg-destructive/10 rounded-md p-3">
                <Text className="text-destructive text-xs">{part.errorText}</Text>
              </View>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
