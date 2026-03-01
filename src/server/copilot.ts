import { CopilotClient } from "@github/copilot-sdk";
import type {
  CountTokensResponse,
  Message,
  ProxyRequest,
  ProxyResponse,
  StreamEvent,
} from "./types.ts";
import { generateMessageId } from "./types.ts";

export interface CopilotSession {
  sendMessage(prompt: string): Promise<string>;
  sendMessageStream(
    prompt: string,
    onChunk: (chunk: string) => void,
  ): Promise<void>;
}

let client: CopilotClient | null = null;

export async function getClient(): Promise<CopilotClient> {
  if (!client) {
    client = new CopilotClient();
    await client.start();
  }
  return client;
}

export async function stopClient(): Promise<void> {
  if (client) {
    await client.stop();
    client = null;
  }
}

export async function createSession(): Promise<CopilotSession> {
  const copilot = await getClient();
  const session = await copilot.createSession({
    model: "gpt-4.1",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onPermissionRequest: (_request: any, _invocation: any) => ({ approved: true } as any),
  });

  return {
    async sendMessage(prompt: string): Promise<string> {
      const response = await session.sendAndWait({ prompt });
      return response?.data.content ?? "";
    },

    async sendMessageStream(
      prompt: string,
      onChunk: (chunk: string) => void,
    ): Promise<void> {
      const streamingSession = await copilot.createSession({
        model: "gpt-4.1",
        streaming: true,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onPermissionRequest: (_request: any, _invocation: any) => ({ approved: true } as any),
      });

      streamingSession.on(
        "assistant.message_delta",
        (event: { data: { deltaContent: string } }) => {
          onChunk(event.data.deltaContent);
        },
      );

      await streamingSession.sendAndWait({ prompt });
    },
  };
}

export async function chat(request: ProxyRequest): Promise<ProxyResponse> {
  const prompt = transformToPrompt(request);
  const session = await createSession();
  const content = await session.sendMessage(prompt);

  return {
    id: generateMessageId(),
    type: "message",
    role: "assistant",
    content: [{ type: "text", text: content }],
    model: request.model,
    stop_reason: "end_turn",
    stop_sequence: null,
    usage: {
      input_tokens: estimateTokens(prompt),
      output_tokens: estimateTokens(content),
    },
  };
}

export async function chatStream(
  request: ProxyRequest,
  onChunk: (event: StreamEvent) => void,
): Promise<void> {
  const prompt = transformToPrompt(request);
  const session = await createSession();

  const messageId = generateMessageId();
  const inputTokens = estimateTokens(prompt);

  onChunk({
    type: "message_start",
    message: {
      id: messageId,
      type: "message",
      role: "assistant",
      model: request.model,
      usage: { input_tokens: inputTokens, output_tokens: 0 },
    },
  });

  onChunk({
    type: "content_block_start",
    index: 0,
    content_block: { type: "text" },
  });

  await session.sendMessageStream(prompt, (chunk) => {
    onChunk({
      type: "content_block_delta",
      index: 0,
      delta: { type: "text_delta", text: chunk },
    });
  });

  onChunk({ type: "content_block_stop", index: 0 });

  onChunk({
    type: "message_delta",
    usage: { input_tokens: inputTokens, output_tokens: 0 },
    delta: { type: "stop_reason", stop_reason: "end_turn" },
  });

  onChunk({ type: "message_stop" });
}

export function countTokens(
  request: { model: string; messages: Message[] },
): CountTokensResponse {
  const prompt = transformToPrompt(request);
  const tokens = estimateTokens(prompt);

  return {
    id: generateMessageId(),
    type: "message",
    role: "assistant",
    content: [],
    model: request.model,
    stop_reason: null,
    stop_sequence: null,
    usage: {
      input_tokens: tokens,
      output_tokens: 0,
    },
  };
}

function transformToPrompt(
  request: { system?: string; messages: Message[] },
): string {
  const parts: string[] = [];

  if (request.system) {
    parts.push(`System: ${request.system}`);
  }

  for (const msg of request.messages) {
    const label = msg.role === "user" ? "User" : "Assistant";
    parts.push(`${label}: ${msg.content}`);
  }

  return parts.join("\n\n");
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
