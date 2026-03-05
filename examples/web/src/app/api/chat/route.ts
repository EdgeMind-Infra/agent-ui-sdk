import { createAnthropic } from "@ai-sdk/anthropic";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

const anthropic = createAnthropic({
  baseURL: process.env.ANTHROPIC_BASE_URL,
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, { headers: corsHeaders });
}

export async function POST(req: Request) {
  const {
    messages,
    thinking,
    webSearch,
  }: { messages: UIMessage[]; thinking?: boolean; webSearch?: boolean } = await req.json();

  const result = streamText({
    model: anthropic("claude-opus-4-6"),
    messages: await convertToModelMessages(messages),
    tools: {
      ...(webSearch && { web_search: anthropic.tools.webSearch_20260209() }),
    },
    ...(thinking && {
      providerOptions: {
        anthropic: {
          thinking: { type: "enabled", budgetTokens: 10000 },
        },
      },
    }),
  });
  return result.toUIMessageStreamResponse({ headers: corsHeaders });
}
