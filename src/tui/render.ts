/**
 * TUI renderer for Coco.
 *
 * Renders the full-screen TUI and supports efficient dirty-row updates.
 * Uses raw ANSI/VT100 sequences — no external dependencies.
 *
 * Layout (per contracts/cli-interface.md):
 *
 *   Coco — Local AI Gateway
 *   ──────────────────────────────────────────────
 *   Status: Running on http://localhost:11434
 *   Copilot: Authenticated ✓
 *
 *   Agents
 *   ──────────────────────────────────────────────
 *   [x] Claude Code      detected
 *   [ ] Cline            installed
 *   ...
 *
 *   ──────────────────────────────────────────────
 *   Space: toggle   Enter: apply   q: quit
 */

import type { DetectionResult } from "../agents/detector.ts";
import type { ServiceState } from "../service/status.ts";

// ---------------------------------------------------------------------------
// ANSI helpers
// ---------------------------------------------------------------------------

const ESC = "\x1b";
const DIVIDER = "──────────────────────────────────────────────";

function bold(s: string): string {
  return `${ESC}[1m${s}${ESC}[0m`;
}

function dim(s: string): string {
  return `${ESC}[2m${s}${ESC}[0m`;
}

function yellow(s: string): string {
  return `${ESC}[33m${s}${ESC}[0m`;
}

function cursorUp(n: number): string {
  return `${ESC}[${n}A`;
}

function clearLine(): string {
  return `${ESC}[2K\r`;
}

function hideCursor(): string {
  return `${ESC}[?25l`;
}

function showCursor(): string {
  return `${ESC}[?25h`;
}

// ---------------------------------------------------------------------------
// State types
// ---------------------------------------------------------------------------

export type AgentConfigStatus = "configured" | "misconfigured" | "unconfigured";

export interface AgentRow {
  name: string;
  displayName: string;
  state: "installed" | "detected" | "not-installed";
  configStatus: AgentConfigStatus;
  /** Whether this row is currently selected (toggled for apply). */
  selected: boolean;
}

export interface TUIState {
  serviceState: ServiceState;
  agents: AgentRow[];
  /** Index of the cursor row (0-based into agents array). */
  cursorIndex: number;
}

// ---------------------------------------------------------------------------
// Public factory
// ---------------------------------------------------------------------------

/**
 * Build a TUIState from service state, detection results, and config.
 */
export function buildTUIState(
  serviceState: ServiceState,
  detectionResults: DetectionResult[],
  configuredAgentNames: Set<string>,
  misconfiguredAgentNames: Set<string>,
): TUIState {
  const agents: AgentRow[] = detectionResults.map((r) => {
    let configStatus: AgentConfigStatus = "unconfigured";
    if (misconfiguredAgentNames.has(r.agent.name)) {
      configStatus = "misconfigured";
    } else if (configuredAgentNames.has(r.agent.name)) {
      configStatus = "configured";
    }
    return {
      name: r.agent.name,
      displayName: r.agent.displayName,
      state: r.state,
      configStatus,
      selected: configStatus === "configured",
    };
  });

  return {
    serviceState,
    agents,
    cursorIndex: 0,
  };
}

// ---------------------------------------------------------------------------
// Row rendering
// ---------------------------------------------------------------------------

/**
 * Render a single agent row.
 * `isCursor` — true when this is the focused row.
 */
export function renderRow(
  row: AgentRow,
  isCursor: boolean,
): string {
  const checkmark = row.selected ? "x" : " ";
  const prefix = row.configStatus === "misconfigured" ? "-" : checkmark;
  const bracket = `[${prefix}]`;

  const nameCol = row.displayName.padEnd(16);
  const stateCol = row.state.padEnd(14);

  let suffix = "";
  if (row.configStatus === "misconfigured") {
    suffix = " (misconfigured)";
  }

  let line = `${bracket} ${nameCol} ${stateCol}${suffix}`;

  if (row.state === "not-installed") {
    line = dim(line);
  } else if (row.configStatus === "misconfigured") {
    line = yellow(line);
  } else if (isCursor) {
    line = bold(line);
  }

  return line;
}

// ---------------------------------------------------------------------------
// Header / footer
// ---------------------------------------------------------------------------

function renderHeader(state: TUIState): string[] {
  const { serviceState } = state;
  const statusLine = serviceState.running
    ? `Status:  Running on http://localhost:${serviceState.port}`
    : "Status:  Not running";
  const authLine = serviceState.authStatus === "authenticated"
    ? "Copilot: Authenticated ✓"
    : "Copilot: Not authenticated";

  return [
    bold("Coco — Local AI Gateway"),
    DIVIDER,
    statusLine,
    authLine,
    "",
    "Agents",
    DIVIDER,
  ];
}

function renderFooter(): string[] {
  return [
    "",
    DIVIDER,
    "Space: toggle   Enter: apply   q: quit",
  ];
}

// ---------------------------------------------------------------------------
// Full render
// ---------------------------------------------------------------------------

/**
 * Render the entire TUI to stdout.
 * Hides the cursor during the render to prevent flicker.
 */
export function renderFull(state: TUIState): void {
  const lines: string[] = [
    hideCursor(),
    ...renderHeader(state),
    ...state.agents.map((row, i) => renderRow(row, i === state.cursorIndex)),
    ...renderFooter(),
    showCursor(),
  ];
  Deno.stdout.writeSync(new TextEncoder().encode(lines.join("\n") + "\n"));
}

// ---------------------------------------------------------------------------
// Dirty-row update
// ---------------------------------------------------------------------------

/** Number of header lines (static, computed from renderHeader). */
const HEADER_LINE_COUNT = 7; // bold title + divider + status + auth + blank + Agents + divider

/**
 * Redraw only the rows at the given indices, using cursor-up arithmetic.
 * `totalRows` is the total number of agent rows.
 */
export function renderDirty(
  state: TUIState,
  dirtyRowIndices: number[],
  totalRows: number,
): void {
  if (dirtyRowIndices.length === 0) return;

  // Total lines rendered = header + agent rows + footer
  const totalLines = HEADER_LINE_COUNT + totalRows + 3; // 3 footer lines
  const enc = new TextEncoder();

  let out = hideCursor();

  for (const idx of dirtyRowIndices) {
    // Lines from the bottom to this row
    const lineFromBottom = totalLines - (HEADER_LINE_COUNT + idx) - 1;
    out += cursorUp(lineFromBottom);
    out += clearLine();
    out += renderRow(state.agents[idx], idx === state.cursorIndex);
    // Move back down
    out += `${ESC}[${lineFromBottom}B`;
  }

  out += showCursor();
  Deno.stdout.writeSync(enc.encode(out));
}

// ---------------------------------------------------------------------------
// Clear screen helper
// ---------------------------------------------------------------------------

export function clearScreen(): void {
  Deno.stdout.writeSync(new TextEncoder().encode(`${ESC}[2J${ESC}[H`));
}
