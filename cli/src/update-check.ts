import { join } from "@std/path";
import { configDir, loadConfig } from "../../gateway/src/store.ts";
import { VERSION } from "./version.ts";

const GITHUB_API = "https://api.github.com/repos/modmux/modmux/releases/latest";
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours
const FETCH_TIMEOUT_MS = 3_000;

interface UpdateCheckState {
  lastChecked: string;
  latestVersion: string;
}

interface GithubRelease {
  tag_name: string;
}

interface ParsedVersion {
  core: number[];
  prerelease: string[];
}

function stateFilePath(): string {
  return join(configDir(), "update-check.json");
}

async function readState(): Promise<UpdateCheckState | null> {
  try {
    const raw = await Deno.readTextFile(stateFilePath());
    return JSON.parse(raw) as UpdateCheckState;
  } catch {
    return null;
  }
}

async function writeState(state: UpdateCheckState): Promise<void> {
  try {
    await Deno.mkdir(configDir(), { recursive: true });
    await Deno.writeTextFile(
      stateFilePath(),
      JSON.stringify(state, null, 2) + "\n",
    );
  } catch {
    // State write failure is non-fatal
  }
}

async function fetchLatestVersion(): Promise<string | null> {
  try {
    const signal = AbortSignal.timeout(FETCH_TIMEOUT_MS);
    const res = await fetch(GITHUB_API, {
      headers: { "Accept": "application/vnd.github+json" },
      signal,
    });
    if (!res.ok) return null;
    const release = await res.json() as GithubRelease;
    return release.tag_name.replace(/^v/, "");
  } catch {
    return null;
  }
}

function parseVersion(version: string): ParsedVersion | null {
  const normalized = version.trim().replace(/^v/, "");
  if (normalized.length === 0) return null;

  const [mainAndPre] = normalized.split("+", 1);
  const [coreRaw, prereleaseRaw] = mainAndPre.split("-", 2);
  const core = coreRaw.split(".").map((part) => Number(part));
  if (core.some((part) => !Number.isInteger(part) || part < 0)) return null;

  return {
    core,
    prerelease: prereleaseRaw?.split(".") ?? [],
  };
}

function comparePrerelease(a: string[], b: string[]): number {
  const length = Math.max(a.length, b.length);
  for (let i = 0; i < length; i++) {
    const left = a[i];
    const right = b[i];

    if (left === undefined) return -1;
    if (right === undefined) return 1;

    const leftNum = /^\d+$/.test(left) ? Number(left) : null;
    const rightNum = /^\d+$/.test(right) ? Number(right) : null;

    if (leftNum !== null && rightNum !== null) {
      if (leftNum !== rightNum) return leftNum - rightNum;
      continue;
    }

    if (leftNum !== null) return -1;
    if (rightNum !== null) return 1;

    if (left !== right) return left < right ? -1 : 1;
  }

  return 0;
}

function isNewerVersion(candidate: string, current: string): boolean {
  const candidateVersion = parseVersion(candidate);
  const currentVersion = parseVersion(current);
  if (candidateVersion === null || currentVersion === null) return false;

  const length = Math.max(
    candidateVersion.core.length,
    currentVersion.core.length,
  );
  for (let i = 0; i < length; i++) {
    const left = candidateVersion.core[i] ?? 0;
    const right = currentVersion.core[i] ?? 0;
    if (left !== right) return left > right;
  }

  const candidateStable = candidateVersion.prerelease.length === 0;
  const currentStable = currentVersion.prerelease.length === 0;
  if (candidateStable !== currentStable) return candidateStable;
  if (candidateStable) return false;

  return comparePrerelease(
    candidateVersion.prerelease,
    currentVersion.prerelease,
  ) > 0;
}

/**
 * Checks GitHub releases at most once per day. Returns the newer version string
 * if one is available, or null if up-to-date or the check fails. Failures are
 * always silent.
 */
export async function checkForNewerVersion(): Promise<string | null> {
  try {
    const config = await loadConfig();
    if (!config.updates.checkEnabled) return null;
  } catch {
    // If config can't be loaded, proceed with default (enabled)
  }

  const state = await readState();
  const now = Date.now();

  if (state !== null) {
    const lastChecked = new Date(state.lastChecked).getTime();
    if (!isNaN(lastChecked) && now - lastChecked < CHECK_INTERVAL_MS) {
      return isNewerVersion(state.latestVersion, VERSION)
        ? state.latestVersion
        : null;
    }
  }

  const latestVersion = await fetchLatestVersion();
  if (latestVersion === null) return null;

  await writeState({ lastChecked: new Date(now).toISOString(), latestVersion });

  return isNewerVersion(latestVersion, VERSION) ? latestVersion : null;
}

/**
 * Checks GitHub releases at most once per day. If a newer version is found,
 * prints a notification to stderr. Failures are always silent.
 */
export async function maybeNotifyUpdate(): Promise<void> {
  const newerVersion = await checkForNewerVersion();
  if (newerVersion !== null) {
    printNotification(newerVersion);
  }
}

function printNotification(latestVersion: string): void {
  console.error(
    `\nA new version of Modmux is available: v${latestVersion} (you have v${VERSION})`,
  );
  console.error(`Run 'modmux upgrade' to update.\n`);
}

export const _test = {
  isNewerVersion,
};
