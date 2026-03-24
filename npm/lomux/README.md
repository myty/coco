# lomux

Use your GitHub Copilot subscription with Cline, Codex, and Claude Code.

## Installation

```bash
npm install -g lomux
```

## Supported Platforms

| Platform | Architecture | npm Package          |
| -------- | ------------ | -------------------- |
| macOS    | arm64        | `@lomux/darwin-arm64` |
| macOS    | x64          | `@lomux/darwin-x64`   |
| Linux    | x64          | `@lomux/linux-x64`    |
| Linux    | arm64        | `@lomux/linux-arm64`  |
| Windows  | x64          | `@lomux/win32-x64`    |

## How it works

When you run `lomux`, the shim:

1. Detects your platform and resolves the matching `@lomux/<os>-<arch>` optional
   dependency
2. Runs the native binary directly — no Deno runtime required
3. If no platform binary is available, falls back to
   `deno run jsr:@lomux/lomux` (requires [Deno](https://deno.land) installed)
4. If neither is available, prints an error with a link to manual download

## Manual Download

Download pre-built binaries from the
[GitHub Releases](https://github.com/lomux/lomux/releases) page.
