"use client";

import { cn } from "src/lib/utils";
import type { ChatProps } from "../types";
import { ChatInput } from "./chat-input";
import { ChatMessages } from "./chat-messages";
import { ChatProvider } from "./chat-provider";

export function Chat({ chatHelpers, components, config, className, ...props }: ChatProps) {
  const MessagesComponent = components?.Messages ?? ChatMessages;
  const InputComponent = components?.Input ?? ChatInput;

  return (
    <ChatProvider chatHelpers={chatHelpers} components={components} config={config}>
      <div
        className={cn("relative flex size-full flex-col divide-y overflow-hidden", className)}
        {...props}
      >
        <MessagesComponent />
        <InputComponent />
      </div>
    </ChatProvider>
  );
}
