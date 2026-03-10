import { assertEquals } from "@std/assert";
import {
  anthropicStreamEventToOpenAI,
  anthropicToOpenAI,
  makeStreamState,
  openAIToAnthropic,
} from "../../src/server/openai-translate.ts";
import type { StreamEvent } from "../../src/server/types.ts";

// ---------------------------------------------------------------------------
// openAIToAnthropic
// ---------------------------------------------------------------------------

Deno.test("openAIToAnthropic — basic message conversion", () => {
  const req = openAIToAnthropic({
    model: "gpt-4o",
    messages: [
      { role: "user", content: "Hello" },
      { role: "assistant", content: "Hi!" },
      { role: "user", content: "How are you?" },
    ],
  });
  assertEquals(req.model, "gpt-4o");
  assertEquals(req.messages.length, 3);
  assertEquals(req.system, undefined);
});

Deno.test("openAIToAnthropic — system message extracted to system field", () => {
  const req = openAIToAnthropic({
    model: "gpt-4o",
    messages: [
      { role: "system", content: "You are helpful." },
      { role: "user", content: "Hello" },
    ],
  });
  assertEquals(req.system, "You are helpful.");
  assertEquals(req.messages.length, 1);
  assertEquals(req.messages[0].role, "user");
});

Deno.test("openAIToAnthropic — multiple system messages joined", () => {
  const req = openAIToAnthropic({
    model: "gpt-4o",
    messages: [
      { role: "system", content: "Line 1" },
      { role: "system", content: "Line 2" },
      { role: "user", content: "Hi" },
    ],
  });
  assertEquals(req.system, "Line 1\nLine 2");
  assertEquals(req.messages.length, 1);
});

Deno.test("openAIToAnthropic — max_tokens defaults to 4096 when absent", () => {
  const req = openAIToAnthropic({
    model: "gpt-4o",
    messages: [{ role: "user", content: "Hi" }],
  });
  assertEquals(req.max_tokens, 4096);
});

Deno.test("openAIToAnthropic — max_tokens passed through when provided", () => {
  const req = openAIToAnthropic({
    model: "gpt-4o",
    messages: [{ role: "user", content: "Hi" }],
    max_tokens: 512,
  });
  assertEquals(req.max_tokens, 512);
});

// ---------------------------------------------------------------------------
// anthropicToOpenAI
// ---------------------------------------------------------------------------

Deno.test("anthropicToOpenAI — basic response shape", () => {
  const resp = anthropicToOpenAI(
    {
      id: "msg_abc123",
      type: "message",
      role: "assistant",
      content: [{ type: "text", text: "Hello!" }],
      model: "gpt-4o",
      stop_reason: "end_turn",
      stop_sequence: null,
      usage: { input_tokens: 10, output_tokens: 5 },
    },
    "gpt-4o",
  );
  assertEquals(resp.object, "chat.completion");
  assertEquals(resp.model, "gpt-4o");
  assertEquals(resp.choices[0].message.content, "Hello!");
  assertEquals(resp.choices[0].finish_reason, "stop");
  assertEquals(resp.usage.prompt_tokens, 10);
  assertEquals(resp.usage.completion_tokens, 5);
  assertEquals(resp.usage.total_tokens, 15);
});

Deno.test("anthropicToOpenAI — stop_reason max_tokens → finish_reason length", () => {
  const resp = anthropicToOpenAI(
    {
      id: "msg_xyz",
      type: "message",
      role: "assistant",
      content: [{ type: "text", text: "..." }],
      model: "gpt-4o",
      stop_reason: "max_tokens",
      stop_sequence: null,
      usage: { input_tokens: 5, output_tokens: 10 },
    },
    "gpt-4o",
  );
  assertEquals(resp.choices[0].finish_reason, "length");
});

// ---------------------------------------------------------------------------
// anthropicStreamEventToOpenAI
// ---------------------------------------------------------------------------

Deno.test("anthropicStreamEventToOpenAI — message_start emits role chunk", () => {
  const state = makeStreamState("gpt-4o");
  const event: StreamEvent = {
    type: "message_start",
    message: {
      id: "msg_1",
      type: "message",
      role: "assistant",
      model: "gpt-4o",
      usage: { input_tokens: 0, output_tokens: 0 },
    },
  };
  const line = anthropicStreamEventToOpenAI(event, state);
  assertEquals(line !== null, true);
  const data = JSON.parse(line!.replace("data: ", "").trim());
  assertEquals(data.object, "chat.completion.chunk");
  assertEquals(data.choices[0].delta.role, "assistant");
});

Deno.test("anthropicStreamEventToOpenAI — content_block_delta emits content", () => {
  const state = makeStreamState("gpt-4o");
  const event: StreamEvent = {
    type: "content_block_delta",
    index: 0,
    delta: { type: "text_delta", text: "Hello" },
  };
  const line = anthropicStreamEventToOpenAI(event, state);
  assertEquals(line !== null, true);
  const data = JSON.parse(line!.replace("data: ", "").trim());
  assertEquals(data.choices[0].delta.content, "Hello");
});

Deno.test("anthropicStreamEventToOpenAI — message_stop emits [DONE]", () => {
  const state = makeStreamState("gpt-4o");
  const event: StreamEvent = { type: "message_stop" };
  const line = anthropicStreamEventToOpenAI(event, state);
  assertEquals(line, "data: [DONE]\n\n");
});

Deno.test("anthropicStreamEventToOpenAI — content_block_start returns null", () => {
  const state = makeStreamState("gpt-4o");
  const event: StreamEvent = {
    type: "content_block_start",
    index: 0,
    content_block: { type: "text" },
  };
  const line = anthropicStreamEventToOpenAI(event, state);
  assertEquals(line, null);
});
