import { assertEquals, assertStringIncludes } from "@std/assert";

const CLI_PATH = "./src/cli/main.ts";

Deno.test({
  name: "CLI --help displays help message",
  fn() {
    const process = new Deno.Command(Deno.execPath(), {
      args: ["run", "--allow-all", CLI_PATH, "--help"],
    }).outputSync();
    const decoder = new TextDecoder();
    const output = decoder.decode(process.stdout);
    
    assertStringIncludes(output, "Claudio");
    assertStringIncludes(output, "--help");
    assertStringIncludes(output, "--version");
  },
});

Deno.test({
  name: "CLI --version displays version",
  fn() {
    const process = new Deno.Command(Deno.execPath(), {
      args: ["run", "--allow-all", CLI_PATH, "--version"],
    }).outputSync();
    const decoder = new TextDecoder();
    const output = decoder.decode(process.stdout);
    
    assertStringIncludes(output, "Claudio v");
  },
});

Deno.test({
  name: "CLI exits with code 0 on --help",
  async fn() {
    const process = new Deno.Command(Deno.execPath(), {
      args: ["run", "--allow-all", CLI_PATH, "--help"],
    }).spawn();
    
    const status = await process.status;
    assertEquals(status.code, 0);
  },
});

Deno.test({
  name: "CLI exits with code 0 on --version",
  async fn() {
    const process = new Deno.Command(Deno.execPath(), {
      args: ["run", "--allow-all", CLI_PATH, "--version"],
    }).spawn();
    
    const status = await process.status;
    assertEquals(status.code, 0);
  },
});

Deno.test({
  name: "CLI accepts -h alias for --help",
  fn() {
    const process = new Deno.Command(Deno.execPath(), {
      args: ["run", "--allow-all", CLI_PATH, "-h"],
    }).outputSync();
    const decoder = new TextDecoder();
    const output = decoder.decode(process.stdout);
    
    assertStringIncludes(output, "Claudio");
  },
});

Deno.test({
  name: "CLI accepts -v alias for --version",
  fn() {
    const process = new Deno.Command(Deno.execPath(), {
      args: ["run", "--allow-all", CLI_PATH, "-v"],
    }).outputSync();
    const decoder = new TextDecoder();
    const output = decoder.decode(process.stdout);
    
    assertStringIncludes(output, "Claudio v");
  },
});

Deno.test({
  name: "CLI shows Ready when authenticated",
  fn() {
    const process = new Deno.Command(Deno.execPath(), {
      args: ["run", "--allow-all", CLI_PATH],
    }).outputSync();
    const decoder = new TextDecoder();
    const output = decoder.decode(process.stdout);
    
    assertStringIncludes(output, "Ready");
  },
});
