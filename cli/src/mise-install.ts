import { join, normalize } from "@std/path";

function homeDir(): string {
  return Deno.env.get("HOME") ?? Deno.env.get("USERPROFILE") ?? ".";
}

function miseDataDir(): string {
  const configured = Deno.env.get("MISE_DATA_DIR");
  if (configured?.trim()) return configured;

  if (Deno.build.os === "windows") {
    const localAppData = Deno.env.get("LOCALAPPDATA");
    if (localAppData?.trim()) return join(localAppData, "mise");
  }

  const xdgDataHome = Deno.env.get("XDG_DATA_HOME");
  if (xdgDataHome?.trim()) return join(xdgDataHome, "mise");

  return join(homeDir(), ".local", "share", "mise");
}

export function isExecPathInMiseInstall(execPath: string): boolean {
  const installsRoot = normalize(join(miseDataDir(), "installs", "modmux"));
  const normalizedExecPath = normalize(execPath);
  const separator = normalizedExecPath.includes("\\") ? "\\" : "/";
  const prefix = installsRoot.endsWith(separator)
    ? installsRoot
    : `${installsRoot}${separator}`;

  return normalizedExecPath === installsRoot ||
    normalizedExecPath.startsWith(prefix);
}

export function isRunningFromMiseInstall(): boolean {
  return isExecPathInMiseInstall(Deno.execPath());
}
