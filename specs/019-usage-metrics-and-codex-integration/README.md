---
status: complete
created: 2026-03-23
priority: high
tags:
  - usage
  - metrics
  - observability
  - codex
  - api
  - proxy
depends_on:
  - 010-usage-translation
created_at: 2026-03-23T11:31:46.262636Z
updated_at: 2026-03-23T12:15:00.000000Z
completed_at: 2026-03-23T12:15:00.000000Z
transitions:
  - status: in-progress
    at: 2026-03-23T11:40:00.000000Z
  - status: complete
    at: 2026-03-23T12:15:00.000000Z
---

# Ardo Usage Data Collection and Codex Integration

## Overview

Add first-class usage telemetry to Ardo so the server can report endpoint call
volume, success/error rates, latency, and optional model/agent dimensions
through a dedicated API endpoint consumable by Codex.

This spec follows a compatibility-first rollout so Claude Code and Cline benefit
without any client-side changes.

## Design

### Scope

- Ensure usage data is exposed through existing Anthropic/OpenAI response
  contracts first (Path 1).
- Add runtime usage counters and latency tracking at API entry points.
- Expose current usage metrics at a new endpoint (`/v1/usage` preferred,
  `/metrics` optional alias).
- Define a stable JSON schema for downstream consumers.
- Add Codex-side integration guidance for polling and parsing usage metrics.
- Cover behavior with contract and integration tests.

### Path 1 Compatibility First

To support Claude Code and Cline immediately, Ardo must prioritize
protocol-compatible usage data already consumed by these clients:

- Anthropic-compatible usage fields for `/v1/messages` (streaming and
  non-streaming).
- OpenAI-compatible usage fields and final streaming usage chunk for
  `/v1/chat/completions`.
- Responses API usage details for `/v1/responses` where applicable.

This is primarily covered by `010-usage-translation` and should be treated as a
hard prerequisite for aggregate metrics work.

### Metrics Model

Track the following dimensions at minimum:

- Endpoint call totals (`/v1/messages`, `/v1/chat/completions`, `/v1/models`,
  `/v1/responses`, and `/health` as needed).
- Outcome buckets: success and error counts by status class (`2xx`, `4xx`,
  `5xx`).
- Latency aggregates per endpoint: count, min, max, avg.
- Last-updated timestamps and process start time.

Optional dimensions (behind lightweight extension points):

- Distinct API key/user identifiers (privacy-safe hashing/anonymization if
  enabled).
- Per-model usage and per-agent usage counts.
- Streaming durations and token totals where available.

### Storage Strategy

- Default: in-memory counters for low overhead and immediate visibility.
- Optional persistence mode: periodic snapshots to `~/.ardo/usage.json` and
  restore-on-start.
- Persistence must be best-effort and never block request handling.

### API Contract

Expose `GET /v1/usage` returning JSON:

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

Auth behavior must follow existing Ardo proxy policy. If auth is not currently
enforced for read-only endpoints, document that explicitly and include a
follow-up item for hardening.

### Integration Points

- `src/server/router.ts`: endpoint entry instrumentation and `/v1/usage` route.
- `src/server/server.ts`: lifecycle hooks for metrics initialization/shutdown
  persistence.
- `src/server/transform.ts`: optional streaming duration/token rollups.
- `src/config/store.ts`: optional persistence helpers.

### Codex Integration

Codex consumers should:

- Fetch `GET /v1/usage` on interval or on-demand.
- Parse metrics schema defensively to allow additive fields.
- Handle endpoint unavailability with retries/backoff and degraded-mode
  behavior.

## Plan

- [x] Validate Path 1 compatibility against current behavior for Claude Code and
      Cline.
- [x] Close any remaining gaps in protocol-compatible usage fields/chunks before
      aggregate telemetry.
- [x] Define `UsageMetrics` data structures and update contract types for
      response payloads.
- [x] Implement metrics recorder module with endpoint counters, status buckets,
      and latency aggregation.
- [x] Instrument request handling paths in `src/server/router.ts` and related
      handlers.
- [x] Add `GET /v1/usage` endpoint and response serialization.
- [x] Add optional persistence (snapshot + restore) behind config toggle.
- [x] Integrate optional streaming/token dimensions where data already exists.
- [x] Add contract tests for `/v1/usage` shape and correctness under mixed
      traffic.
- [x] Add integration tests validating metrics mutation across representative
      endpoints.
- [x] Update docs with endpoint usage, schema, and Codex consumption guidance.

## Test

- [x] Claude Code receives non-zero usage data via existing Anthropic-compatible
      responses.
- [x] Cline receives non-zero usage data via existing OpenAI-compatible
      responses.
- [x] Streaming usage finalization behavior matches client expectations (final
      usage chunk/event before done semantics as applicable).
- [x] `tests/contract/usage_endpoint_test.ts` validates response schema and HTTP
      semantics.
- [x] Endpoint counters increment correctly for `/v1/messages`,
      `/v1/chat/completions`, `/v1/models`, and `/v1/responses`.
- [x] Status buckets correctly classify success and error responses.
- [x] Latency aggregates are non-negative and update per request.
- [x] Metrics endpoint remains resilient when persistence I/O fails (if
      persistence enabled).
- [x] Codex consumer smoke test (or fixture-based parser test) validates
      polling + parse behavior.

## Notes

### Milestones

- (A) Validate and complete Path 1 compatibility for Claude Code and Cline
- (B) Instrument internal counters in handlers (`router.ts`)
- (C) Add `/v1/usage` endpoint
- (D) Enable Codex to fetch and parse `/v1/usage`
- (E) Write tests for metrics and compatibility
- (F) Extend persistence/formatting as needed

### Non-Goals (initial iteration)

- Full Prometheus exposition format.
- Long-term historical analytics storage.
- Multi-process distributed aggregation.

### Risks

- Hot-path overhead if instrumentation performs excessive object allocation.
- Metrics drift if not all error paths are instrumented.
- Backward compatibility concerns if response shape changes without versioning.

Mitigations: keep recorder logic allocation-light, centralize recording hooks,
and treat schema additions as backward compatible only.
