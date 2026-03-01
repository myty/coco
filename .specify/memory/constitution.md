# Claudio Constitution

<!--
Sync Impact Report:
- Version change: 1.1.0 → 1.2.0
- Added: Principle VII - Quality Gates
- Templates requiring updates: deno.json (add lint, fmt, check tasks)
-->

Claudio provides a minimal, reliable bridge that enables Claude Code to run using GitHub Copilot models. Claudio handles authentication, proxying, environment preparation, and process orchestration. Its presence is intentionally brief and understated: it prepares the environment, ensures stability, and then steps aside so Claude Code can take over.

## Core Principles

### I. Minimalism
Only the essential steps required to prepare and launch Claude Code. No additional features, configuration surfaces, or workflow layers. Claudio does one thing well: bridges Claude Code to Copilot models.

### II. Calm UX
Quiet, steady, reassuring output. Slow, subtle animations (approximately 350-400ms). Short, emotionally neutral lines. No humor, metaphors, or personality spikes. The setup experience uses soft blue/green ANSI-safe colors.

### III. Predictability
Deterministic behavior, consistent across platforms and runs. All request/response transformations are explicit, reviewable, and spec-driven. The proxy is stateless and ephemeral.

### IV. Separation of Concerns
Claudio prepares; Claude Code performs. Claudio never interferes once Claude Code is running. Claudio is not responsible for implementing a chat interface, replacing Claude Code, managing project context, or persisting long-term state beyond authentication.

### V. Portability
Single-binary or JSR package with minimal dependencies. Distributed via JSR, npm (via shim), and compiled binaries. No background daemons or persistent processes. Implemented in Deno with TypeScript.

### VI. Contract Testing (NON-NEGOTIABLE)
Tests are a core part of every feature and user story. Every user story MUST have corresponding tests that validate the story's acceptance criteria. Tests MUST verify contracts (interfaces, APIs, CLI behavior) rather than implementation details. Implementation changes that preserve contracts should not break tests. Each feature MUST include contract tests in tests/contract/ that verify external interfaces.

### VII. Quality Gates (NON-NEGOTIABLE)
All code changes MUST pass quality gates before merging. The required gates are: Deno lint (`deno lint`), type check (`deno check`), formatting (`deno fmt`), and tests (`deno test`). These gates MUST pass for every code change. The quality gate command is: `deno lint && deno fmt --check && deno check && deno test`.

## Scope

### Responsibilities
Claudio is responsible for:
- Authenticating with GitHub Copilot via device flow
- Starting a local Anthropic-compatible proxy backed by the Copilot SDK
- Translating Anthropic requests/responses to and from Copilot equivalents
- Preparing all required environment variables for Claude Code
- Launching Claude Code as a subprocess with inherited I/O
- Shutting down cleanly when Claude Code exits
- Providing minimal, varied, reassuring setup messages and subtle animations

### Non-Responsibilities
Claudio is not responsible for:
- Implementing a chat or coding interface
- Replacing or modifying Claude Code
- Managing project context, tools, or workflows
- Persisting long-term state beyond authentication
- Providing complex configuration or model selection UIs
- Performing any work after Claude Code has launched

## Technical Standards & Security

### Behavioral Guarantees
Claudio must:
- Exit immediately if authentication fails or is invalid
- Validate Copilot availability before launching the proxy
- Expose /v1/messages and /v1/messages/count_tokens with Anthropic-compatible semantics
- Support streaming responses
- Never modify user files or project state
- Never output verbose logs unless explicitly requested
- Always hand off control cleanly to Claude Code
- Shut down the proxy when Claude Code exits

Claudio must not:
- Emit excessive output
- Introduce unnecessary latency
- Override user environment variables without explicit intent
- Continue running after Claude Code begins execution

### Security Expectations
- Authentication tokens stored securely using Deno's permission model
- No external telemetry or analytics
- No network calls beyond Copilot and the local proxy
- No logging of sensitive data
- No mutation of user files or project structure

## Governance

All changes to this constitution must be spec-driven and traceable to a user story or requirement. Breaking changes require explicit version bumps and updated specifications. UX changes must preserve Claudio's emotional tone and visual identity. Proxy behavior must remain Anthropic-compatible unless the spec evolves.

All PRs and reviews must verify compliance with this constitution. Complexity must be justified against the core principles. The constitution supersedes all other practices; amendments require documentation, approval, and a migration plan if applicable.

**Version**: 1.2.0 | **Ratified**: 2026-02-28 | **Last Amended**: 2026-02-28
