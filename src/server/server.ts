import { stopClient } from "./copilot.ts";

export interface ServerConfig {
  port: number;
  hostname: string;
}

export function getConfig(): ServerConfig {
  return {
    port: parseInt(Deno.env.get("CLAUDIO_PORT") || "8080", 10),
    hostname: Deno.env.get("CLAUDIO_HOST") || "127.0.0.1",
  };
}

export async function shutdown(): Promise<void> {
  await stopClient();
}

export function addShutdownHandler(): void {
  Deno.addSignalListener("SIGTERM", async () => {
    await shutdown();
    Deno.exit(0);
  });

  Deno.addSignalListener("SIGINT", async () => {
    await shutdown();
    Deno.exit(0);
  });
}
