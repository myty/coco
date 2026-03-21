#!/usr/bin/env node
// deno-lint-ignore-file
"use strict";

const { spawnSync } = require("child_process");

// Map Node.js platform+arch to @ardo/* package name
const PLATFORM_MAP = {
  "darwin arm64": "@ardo/darwin-arm64",
  "darwin x64": "@ardo/darwin-x64",
  "linux x64": "@ardo/linux-x64",
  "linux arm64": "@ardo/linux-arm64",
  "win32 x64": "@ardo/win32-x64",
};

const platformKey = `${process.platform} ${process.arch}`;
const pkgName = PLATFORM_MAP[platformKey];

if (pkgName) {
  const binaryName = process.platform === "win32" ? "ardo.exe" : "ardo";
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
    ["run", "-A", "jsr:@ardo-org/ardo", ...process.argv.slice(2)],
    { stdio: "inherit", shell: false },
  );
  process.exit(result.status ?? 1);
}

// Neither platform binary nor deno available
console.error(
  `Ardo is not supported on this platform (${process.platform}/${process.arch}).\n` +
    `Please download a binary from https://github.com/ardo-org/ardo/releases or install Deno.`,
);
process.exit(1);
