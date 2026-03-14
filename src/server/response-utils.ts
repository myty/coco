import { openAIError } from "./openai-translate.ts";
import type { ErrorResponse } from "./types.ts";

export const EVENT_STREAM_HEADERS: HeadersInit = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache",
  "Connection": "keep-alive",
};

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function errorResponse(
  status: number,
  type: string,
  message: string,
  param: string | null,
): Response {
  const body: ErrorResponse = {
    type: "error",
    error: { type, message, param },
  };
  return jsonResponse(body, status);
}

export function openAIErrorBody(
  message: string,
  type: string,
  code: string,
): Record<string, unknown> {
  return openAIError(message, type, code);
}

export function openAIErrorResponse(
  status: number,
  message: string,
  type: string,
  code: string,
): Response {
  return jsonResponse(openAIErrorBody(message, type, code), status);
}
