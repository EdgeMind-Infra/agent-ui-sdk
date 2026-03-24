import { View } from "react-native";
import { cn } from "../lib/utils";
import type { ChatProps } from "../types";
import { ChatInput } from "./chat-input";
import { ChatMessages } from "./chat-messages";
import { ChatProvider } from "./chat-provider";

export function Chat({
  chatHelpers,
  components,
  config,
  toolRenderers,
  className,
  ...props
}: ChatProps) {
  const MessagesComponent = components?.Messages ?? ChatMessages;
  const InputComponent = components?.Input ?? ChatInput;

  return (
    <ChatProvider
      chatHelpers={chatHelpers}
      components={components}
      config={config}
      toolRenderers={toolRenderers}
    >
      <View className={cn("flex-1", className)} {...props}>
        <MessagesComponent />
        <InputComponent />
      </View>
    </ChatProvider>
  );
}
