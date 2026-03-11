"use client";

import { cn } from "src/lib/utils";
import type { UIMessage } from "ai";
import type { ChatProps } from "../types";
import { ChatInput } from "./chat-input";
import { ChatMessages } from "./chat-messages";
import { ChatProvider } from "./chat-provider";

export function Chat<UI_MESSAGE extends UIMessage = UIMessage>({
  chatHelpers,
  components,
  config,
  toolRenderers,
  children,
  className,
  ...props
}: ChatProps<UI_MESSAGE>) {
  const MessagesComponent = components?.Messages ?? ChatMessages;
  const InputComponent = components?.Input ?? ChatInput;

  return (
    // ChatProvider context uses bare ChatHelpers — SDK internals don't need typed data parts.
    // The cast is safe: UI_MESSAGE extends UIMessage, runtime shape is identical.
    // biome-ignore lint/suspicious/noExplicitAny: intentional downcast for context boundary
    <ChatProvider
      chatHelpers={chatHelpers as any}
      components={components}
      config={config}
      toolRenderers={toolRenderers}
    >
      <div className={cn("relative flex size-full flex-col overflow-hidden", className)} {...props}>
        <MessagesComponent />
        <InputComponent />
      </div>
      {children}
    </ChatProvider>
  );
}
