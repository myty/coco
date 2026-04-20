import { assertEquals } from "@std/assert";
import { join } from "@std/path";
import { isExecPathInMiseInstall } from "../../cli/src/mise-install.ts";

Deno.test("isExecPathInMiseInstall — matches default Unix installs path", () => {
  const originalMiseDataDir = Deno.env.get("MISE_DATA_DIR");
  Deno.env.set("MISE_DATA_DIR", "/tmp/modmux-mise-data");

  const execPath = join(
    "/tmp/modmux-mise-data",
    "installs",
    "modmux",
    "1.2.3",
    "bin",
    "modmux",
  );

  try {
    assertEquals(isExecPathInMiseInstall(execPath), true);
  } finally {
    if (originalMiseDataDir === undefined) {
      Deno.env.delete("MISE_DATA_DIR");
    } else {
      Deno.env.set("MISE_DATA_DIR", originalMiseDataDir);
    }
  }
});

Deno.test("isExecPathInMiseInstall — respects MISE_DATA_DIR override", () => {
  Deno.env.set("MISE_DATA_DIR", "/opt/custom-mise");

  const execPath = join(
    "/opt/custom-mise",
    "installs",
    "modmux",
    "2.0.0",
    "bin",
    "modmux",
  );

  assertEquals(isExecPathInMiseInstall(execPath), true);
});

Deno.test("isExecPathInMiseInstall — rejects non-mise paths", () => {
  Deno.env.set("MISE_DATA_DIR", "/opt/custom-mise");

  assertEquals(isExecPathInMiseInstall("/usr/local/bin/modmux"), false);
});
