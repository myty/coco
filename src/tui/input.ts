/**
 * Terminal raw-mode input handling for the Coco TUI.
 *
 * Provides key enumeration and raw-mode enter/exit using `stty`.
 */

/** Typed key events emitted by readKey(). */
export type Key =
  | "Space"
  | "Enter"
  | "Quit"
  | "Up"
  | "Down"
  | "CtrlC"
  | "Other";

/**
 * Save current terminal settings via `stty -g` and enable raw mode.
 * Returns the saved settings string for later restoration with disableRawMode().
 */
export async function enableRawMode(): Promise<string> {
  const saveCmd = new Deno.Command("stty", {
    args: ["-g"],
    stdin: "inherit",
    stdout: "piped",
    stderr: "null",
  });
  const { stdout } = await saveCmd.output();
  const saved = new TextDecoder().decode(stdout).trim();

  const rawCmd = new Deno.Command("stty", {
    args: ["-echo", "raw"],
    stdin: "inherit",
    stdout: "null",
    stderr: "null",
  });
  await rawCmd.output();

  return saved;
}

/**
 * Restore terminal settings saved by enableRawMode().
 */
export async function disableRawMode(saved: string): Promise<void> {
  const cmd = new Deno.Command("stty", {
    args: [saved],
    stdin: "inherit",
    stdout: "null",
    stderr: "null",
  });
  await cmd.output();
}

/**
 * Read a single key event from stdin (raw mode assumed).
 * Reads up to 3 bytes to handle escape sequences (arrow keys).
 */
export async function readKey(): Promise<Key> {
  const buf = new Uint8Array(3);
  const n = await Deno.stdin.read(buf);
  if (n === null || n === 0) return "Other";

  const byte0 = buf[0];

  // Ctrl+C
  if (byte0 === 3) return "CtrlC";

  // Enter (CR or LF)
  if (byte0 === 13 || byte0 === 10) return "Enter";

  // Space
  if (byte0 === 32) return "Space";

  // q or Q → quit
  if (byte0 === 113 || byte0 === 81) return "Quit";

  // Escape sequences for arrow keys: ESC [ A/B
  if (byte0 === 27 && n >= 3 && buf[1] === 91) {
    if (buf[2] === 65) return "Up";
    if (buf[2] === 66) return "Down";
  }

  return "Other";
}
