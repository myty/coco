import { chat, chatStream } from "./copilot.ts";
import {
  anthropicStreamEventToOpenAI,
  anthropicToOpenAI,
  makeStreamState,
  openAIToAnthropic,
} from "./openai-translate.ts";
import {
  openAIServiceUnavailable,
  parseOpenAIRequestBody,
  resolveOpenAIModel,
  validateOpenAIModelField,
} from "./openai-handler-utils.ts";
import { isNonEmptyArray } from "./request-utils.ts";
import {
  EVENT_STREAM_HEADERS,
  jsonResponse,
  openAIErrorBody,
  openAIErrorResponse,
} from "./response-utils.ts";
import type { OpenAIChatRequest, ProxyRequest } from "./types.ts";

export async function handleChatCompletions(req: Request): Promise<Response> {
  const bodyOrResponse = await parseOpenAIRequestBody(req);
  if (bodyOrResponse instanceof Response) return bodyOrResponse;
  const body = bodyOrResponse;

  const modelError = validateOpenAIModelField(body);
  if (modelError) return modelError;

  if (!isNonEmptyArray(body.messages)) {
    return openAIErrorResponse(
      400,
      "messages is required and must be non-empty",
      "invalid_request_error",
      "invalid_value",
    );
  }

  const openAIReq = body as unknown as OpenAIChatRequest;
  const resolvedModelOrResponse = await resolveOpenAIModel(
    openAIReq.model,
    "chat_completions",
    "/v1/chat/completions",
  );
  if (resolvedModelOrResponse instanceof Response) {
    return resolvedModelOrResponse;
  }
  const resolvedModel = resolvedModelOrResponse;

  const anthropicReq: ProxyRequest = {
    ...openAIToAnthropic(openAIReq),
    model: resolvedModel,
  };

  if (anthropicReq.stream) {
    const state = makeStreamState(resolvedModel);
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          await chatStream(anthropicReq, (event) => {
            const line = anthropicStreamEventToOpenAI(event, state);
            if (line) controller.enqueue(encoder.encode(line));
          });
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        } catch (err) {
          const errorBody = openAIErrorBody(
            err instanceof Error ? err.message : "Service unavailable",
            "api_error",
            "service_unavailable",
          );
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(errorBody)}\n\n`),
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      status: 200,
      headers: EVENT_STREAM_HEADERS,
    });
  }

  try {
    const anthropicResp = await chat(anthropicReq);
    const openAIResp = anthropicToOpenAI(anthropicResp, resolvedModel);
    return jsonResponse(openAIResp);
  } catch (err) {
    return openAIServiceUnavailable(err);
  }
}
