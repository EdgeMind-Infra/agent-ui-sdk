"use client";

import { cn } from "src/lib/utils";
import type { ChatProps } from "../types";
import { ChatInput } from "./chat-input";
import { ChatMessages } from "./chat-messages";
import { ChatProvider } from "./chat-provider";

export function Chat({
  chatHelpers,
  components,
  config,
  toolRenderers,
  children,
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
      <div
        className={cn("relative flex size-full flex-col overflow-hidden", className)}
        {...props}
      >
        <MessagesComponent />
        <InputComponent />
      </div>
      {children}
    </ChatProvider>
  );
}
