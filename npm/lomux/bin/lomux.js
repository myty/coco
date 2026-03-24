#!/usr/bin/env node
// deno-lint-ignore-file
"use strict";

const { spawnSync } = require("child_process");

// Map Node.js platform+arch to @lomux/* package name
const PLATFORM_MAP = {
  "darwin arm64": "@lomux/darwin-arm64",
  "darwin x64": "@lomux/darwin-x64",
  "linux x64": "@lomux/linux-x64",
  "linux arm64": "@lomux/linux-arm64",
  "win32 x64": "@lomux/win32-x64",
};

const platformKey = `${process.platform} ${process.arch}`;
const pkgName = PLATFORM_MAP[platformKey];

if (pkgName) {
  const binaryName = process.platform === "win32" ? "lomux.exe" : "lomux";
  let binaryPath;
  try {
    binaryPath = require.resolve(`${pkgName}/bin/${binaryName}`);
  } catch (_e) {
    binaryPath = null;
  }

  if (binaryPath) {
    const result = spawnSync(binaryPath, process.argv.slice(2), {
      stdio: "inherit",
      shell: false,
    });
    process.exit(result.status ?? 1);
  }
}

// Fallback: try deno with JSR package
const denoCheck = spawnSync("deno", ["--version"], {
  stdio: "ignore",
  shell: false,
});

if (denoCheck.status === 0) {
  const result = spawnSync(
    "deno",
    ["run", "-A", "jsr:@lomux/lomux", ...process.argv.slice(2)],
    { stdio: "inherit", shell: false },
  );
  process.exit(result.status ?? 1);
}

// Neither platform binary nor deno available
console.error(
  `lomux is not supported on this platform (${process.platform}/${process.arch}).\n` +
    `Please download a binary from https://github.com/lomux-org/lomux/releases or install Deno.`,
);
process.exit(1);
