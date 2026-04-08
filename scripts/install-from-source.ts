import { fromFileUrl, join, resolve } from "@std/path";

function getDefaultInstallDir(): string {
  if (Deno.build.os === "windows") {
    const localAppData = Deno.env.get("LOCALAPPDATA");
    if (localAppData) {
      return join(localAppData, "modmux", "bin");
    }

    const userProfile = Deno.env.get("USERPROFILE");
    if (!userProfile) {
      throw new Error(
        "Unable to determine install directory: neither LOCALAPPDATA nor USERPROFILE is set.",
      );
    }

    return join(userProfile, "AppData", "Local", "modmux", "bin");
  }

  const home = Deno.env.get("HOME");
  if (!home) {
    throw new Error("Unable to determine install directory: HOME is not set.");
  }

  return join(home, ".local", "bin");
}

function getExecutableName(): string {
  return Deno.build.os === "windows" ? "modmux.exe" : "modmux";
}

async function main(): Promise<void> {
  const installDir = Deno.env.get("MODMUX_INSTALL_DIR") ??
    getDefaultInstallDir();
  const outputPath = join(installDir, getExecutableName());

  // Resolve repository root from this script location so invocation cwd does not matter.
  const repoRoot = resolve(fromFileUrl(new URL("..", import.meta.url)));

  await Deno.mkdir(installDir, { recursive: true });

  const args = [
    "compile",
    "--allow-net",
    "--allow-env",
    "--allow-run",
    "--allow-read",
    "--allow-write",
    "--output",
    outputPath,
    "cli/src/main.ts",
  ];

  const command = new Deno.Command("deno", {
    args,
    cwd: repoRoot,
    stdout: "inherit",
    stderr: "inherit",
  });

  const { success, code } = await command.output();
  if (!success) {
    Deno.exit(code);
  }

  if (Deno.build.os !== "windows") {
    await Deno.chmod(outputPath, 0o755);
  }

  console.log(`Installed modmux to ${outputPath}`);
  console.log("If needed, add this directory to PATH:");
  console.log(`  ${installDir}`);
  console.log("Override install directory with MODMUX_INSTALL_DIR.");
}

if (import.meta.main) {
  await main();
}
