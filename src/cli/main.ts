import { startServer } from "../server/router.ts";

function showHelp() {
  console.log(`
Claudio - GitHub Copilot Bridge

Usage: claudio [OPTIONS]

Options:
  --help       Show this help message
  --version    Show version
  --server     Start the proxy server (default)
`.trim());
}

function showVersion() {
  console.log("Claudio v0.1.0");
}

function checkCopilotInstalled(): boolean {
  try {
    const process = new Deno.Command("copilot", {
      args: ["--version"],
    }).outputSync();
    return process.success;
  } catch {
    return false;
  }
}

function verifyCredentials(): boolean {
  try {
    const process = new Deno.Command("gh", {
      args: ["auth", "status"],
    }).outputSync();

    const output = new TextDecoder().decode(process.stdout) +
      new TextDecoder().decode(process.stderr);
    return output.includes("✓ Logged in");
  } catch {
    return false;
  }
}

function main() {
  const args = Deno.args;
  const flags = {
    help: args.includes("--help") || args.includes("-h"),
    version: args.includes("--version") || args.includes("-v"),
    server: args.includes("--server") ||
      !args.includes("--help") && !args.includes("--version"),
  };

  if (flags.help) {
    showHelp();
    Deno.exit(0);
  }

  if (flags.version) {
    showVersion();
    Deno.exit(0);
  }

  if (!checkCopilotInstalled()) {
    console.error(
      "Copilot CLI not found. Please install: https://github.com/cli/cli",
    );
    Deno.exit(1);
  }

  const hasCredentials = verifyCredentials();
  if (!hasCredentials) {
    console.error("Not authenticated. Run: gh auth login");
    Deno.exit(1);
  }

  if (flags.server) {
    startServer();
  } else {
    console.log("Ready.");
  }
}

if (import.meta.main) {
  main();
}
