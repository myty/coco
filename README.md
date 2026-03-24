# lomux

**Use your GitHub Copilot subscription with the agents that don't support it
yet.**

Cline, Codex, and Claude Code are great. But none of them let you use GitHub
Copilot as a model provider. lomux fixes that — it runs a local proxy that speaks
Anthropic and OpenAI protocols, backed entirely by your existing Copilot
subscription. One login. No extra API keys.

Website: https://lomux-org.github.io/lomux/

Migration guide: [MIGRATION.md](MIGRATION.md) Release notes:
[CHANGELOG.md](CHANGELOG.md)

## Why The Name lomux

lomux is built from two ideas that define the product:

- **lo**: everything runs on localhost and stays local-first by design.
- **mux**: this tool multiplexes multiple coding agents through one local gateway.

The result is a short, memorable command that reflects what the software actually does.
It is quick to type, distinct across package ecosystems, and consistent across CLI,
repository, website, and release artifacts.

## Logo Refresh

The current logo asset is temporary during the rename rollout. The project is
moving to a dedicated lomux logo with these constraints:

- Works at favicon size and terminal-adjacent UI contexts.
- Communicates routing/gateway behavior without becoming visually noisy.
- Includes monochrome and full-color variants for docs and site usage.
- Ships with source files and export sizes for web and package assets.

## Features

- 🔗 **Anthropic + OpenAI compatible** — `/v1/messages` and
  `/v1/chat/completions` endpoints
- 📊 **Usage telemetry endpoint** — `GET /v1/usage` for aggregated request,
  status, and latency metrics
- 🚀 **Background service** — `lomux start` / `lomux stop` / `lomux restart`
- 🤖 **Multi-agent support** — Claude Code, Cline, and Codex
- 🖥️ **Minimal TUI** — bare `lomux` opens a radio-toggle interface for batch
  configuration
- 🔍 **Agent detection** — scans PATH and VS Code extension dirs to find
  installed agents
- ♻️ **Reversible config** — every `lomux configure` is undone by
  `lomux unconfigure`
- ⚡ **Stream support** — real-time streaming responses
- 📦 **Multiple install methods** — npm, Deno/JSR, or direct binary

## How It Works

```
Coding agent → lomux proxy (127.0.0.1:11434) → GitHub Copilot API
                │
                ├── POST /v1/messages           (Anthropic)
                ├── POST /v1/chat/completions   (OpenAI)
                ├── GET  /v1/usage
                ├── GET  /v1/models
                └── GET  /health
```

1. **`lomux start`** — authenticates with GitHub and starts the background proxy
2. **`lomux configure <agent>`** — writes the agent's config file to point at
   `http://127.0.0.1:11434`
3. The agent's API calls are translated and forwarded to GitHub Copilot

## Installation

<details>
<summary>📖 From Source (Development / Try It Out)</summary>

Clone the repository and install globally with a single command:

```bash
git clone https://github.com/lomux-org/lomux.git && cd lomux
```

**With Deno:**

```bash
deno task install
```

**With mise:**

```bash
mise run install
```

After installation, `lomux` is available in any terminal:

```bash
lomux --version
# lomux v0.3.0
```

</details>

> **Note**: Ensure `~/.deno/bin` is in your `PATH`. The Deno installer adds this
> automatically.

<details>
<summary>📖 npm (No Deno Required)</summary>

**Node.js ≥18 required**

```bash
npm install -g lomux
```

The npm package automatically downloads the native binary for your platform:

| OS      | Architecture | Status |
| ------- | ------------ | ------ |
| macOS   | arm64        | ✅     |
| macOS   | x64          | ✅     |
| Linux   | x64          | ✅     |
| Linux   | arm64        | ✅     |
| Windows | x64          | ✅     |

</details>

<details>
<summary>📖 JSR (Deno Runtime)</summary>

```bash
deno install -A -g jsr:@lomux/lomux
```

</details>

<details>
<summary>📖 Direct Binary Download</summary>

Download platform-specific binaries from
[GitHub Releases](https://github.com/lomux-org/lomux/releases).

</details>

## Usage

<details>
<summary>📖 TUI (recommended for first-time setup)</summary>

```bash
lomux          # opens the interactive TUI
```

```
lomux — Local AI Gateway
──────────────────────────────────────────────
Status: Running on http://localhost:11434
Copilot: Authenticated ✓

Agents
──────────────────────────────────────────────
[x] Claude Code      detected
[ ] Cline            installed
[ ] Codex            installed

──────────────────────────────────────────────
Space: toggle   Enter: apply   q: quit
```

Keys: **Space** toggles selection, **Enter** applies, **↑/↓** moves cursor,
**q** quits without changes.

</details>

<details>
<summary>📖 CLI Commands</summary>

| Command                                  | Description                                                 |
| ---------------------------------------- | ----------------------------------------------------------- |
| `lomux`                                   | Open the interactive TUI (on TTY) or print status (non-TTY) |
| `lomux start`                             | Start the background proxy service                          |
| `lomux stop`                              | Stop the background proxy service                           |
| `lomux restart`                           | Restart the background proxy service                        |
| `lomux status`                            | Print service and auth status                               |
| `lomux configure <agent>`                 | Write config for a specific agent                           |
| `lomux unconfigure <agent>`               | Revert config for a specific agent                          |
| `lomux doctor`                            | Scan and report all agents' states                          |
| `lomux models`                            | List available Copilot model IDs                            |
| `lomux model-policy [compatible\|strict]` | Show or set model mapping policy                            |
| `lomux install-service`                   | Register daemon with OS login service manager               |
| `lomux uninstall-service`                 | Remove daemon from OS login service manager                 |
| `lomux --help`                            | Show help                                                   |
| `lomux --version`                         | Show version                                                |

</details>

<details>
<summary>🚀 Quick Start</summary>

```bash
# 1. Install lomux
deno task install

# 2. Start the proxy (authenticates with GitHub Copilot on first run)
lomux start

# 3. Configure an agent
lomux configure claude-code

# 4. Check what's running
lomux doctor

# 5. (Optional) Register as a login service
lomux install-service

# To remove the login service later:
# lomux uninstall-service
```

</details>

<details>
<summary>📖 Usage Metrics API</summary>

lomux exposes a local metrics snapshot endpoint:

```bash
curl http://127.0.0.1:11434/v1/usage
```

Response shape:

```json
{
  "process": {
    "started_at": "2026-03-23T00:00:00.000Z",
    "updated_at": "2026-03-23T00:01:00.000Z"
  },
  "totals": {
    "requests": 0,
    "success": 0,
    "errors": 0
  },
  "endpoints": {
    "/v1/messages": {
      "calls": 0,
      "status": { "2xx": 0, "4xx": 0, "5xx": 0 },
      "latency_ms": { "count": 0, "min": 0, "max": 0, "avg": 0 }
    }
  },
  "models": {},
  "agents": {}
}
```

Persistence is optional and configurable via `~/.lomux/config.json`:

```json
{
  "usageMetrics": {
    "persist": false,
    "snapshotIntervalMs": 60000,
    "filePath": null
  }
}
```

</details>

<details>
<summary>📖 Supported Agents</summary>

| Agent       | Binary   | Extension                |
| ----------- | -------- | ------------------------ |
| Claude Code | `claude` | `anthropic.claude-code`  |
| Cline       | `cline`  | `saoudrizwan.claude-dev` |
| Codex       | `codex`  | —                        |

</details>

## Architecture

```
src/
├── cli/              # Command-line interface (main.ts)
├── server/           # HTTP proxy (router, OpenAI/Anthropic translation)
├── service/          # Daemon lifecycle + status
├── agents/           # Registry, detector, config writers, model map
├── tui/              # Renderer and raw-mode input
├── auth/             # GitHub OAuth device flow
├── copilot/          # GitHub Copilot API client
├── config/           # ~/.lomux/config.json store
└── lib/              # Shared utilities (log, process, errors, token)
```

## Prerequisites

- **GitHub Copilot subscription** — Individual, Business, or Enterprise

## Development

```bash
# Clone and run quality checks
git clone https://github.com/lomux-org/lomux.git && cd lomux
deno task quality

# Run in development mode
deno task dev

# Compile native binary
deno task compile
```

## Troubleshooting

<details>
<summary>Common Issues</summary>

<details>
<summary>📖 "Authentication failed"</summary>

- Verify you have an active GitHub Copilot subscription
- Try again — device flow tokens sometimes need a moment

</details>

<details>
<summary>📖 "Port already in use"</summary>

- lomux automatically scans for an available port starting from 11434
- Check `lomux status` to see the actual port in use

</details>

<details>
<summary>🔧 "Agent is misconfigured"</summary>

- Run `lomux unconfigure <agent>` then `lomux configure <agent>` again
- Run `lomux doctor` for a full status report

</details>

<details>
<summary>📖 macOS "Cannot open" error (binary download)</summary>

- Run `xattr -d com.apple.quarantine lomux` to remove quarantine

</details>

</details>

## License

MIT License.

## Acknowledgments

- **GitHub** for the Copilot API
- **Anthropic** for Claude Code
- **Deno** for the excellent runtime and tooling
