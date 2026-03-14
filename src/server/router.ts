import { handleChatCompletions } from "./chat-handler.ts";
import { handleCountTokens, handleMessages } from "./messages-handler.ts";
import { handleModels } from "./models-handler.ts";
import { errorResponse, jsonResponse } from "./response-utils.ts";
import { handleResponses } from "./responses-handler.ts";
import { addShutdownHandler, getConfig } from "./server.ts";
import { log } from "../lib/log.ts";

const server = Deno.serve;

export async function handleRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);

  if (url.pathname === "/health") {
    return jsonResponse({ status: "ok" });
  }

  if (req.method === "POST" && url.pathname === "/v1/messages") {
    return await handleMessages(req);
  }

  if (req.method === "POST" && url.pathname === "/v1/messages/count_tokens") {
    return await handleCountTokens(req);
  }

  if (req.method === "POST" && url.pathname === "/v1/chat/completions") {
    return await handleChatCompletions(req);
  }

  if (req.method === "POST" && url.pathname === "/v1/responses") {
    return await handleResponses(req);
  }

  if (req.method === "GET" && url.pathname === "/v1/models") {
    return await handleModels();
  }

  return errorResponse(
    404,
    "invalid_request_error",
    "Not found",
    null,
  );
}

export async function startServer(): Promise<
  { port: number; stop: () => Promise<void> }
> {
  const config = await getConfig();
  addShutdownHandler();

  const httpServer = server({
    hostname: config.hostname,
    port: config.port,
    handler: handleRequest,
    onListen: ({ port, hostname }) => {
      log("info", "Server started", { port, hostname });
    },
  });

  const { port } = httpServer.addr as Deno.NetAddr;

  return {
    port,
    stop: () => httpServer.shutdown(),
  };
}
