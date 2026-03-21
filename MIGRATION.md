# Migration Guide: Coco -> Ardo

This repository has been renamed from **Coco** to **Ardo**.

Ardo is now the canonical project name, command name, package name, and configuration namespace.

## What Changed

- Project and repository identity moved to Ardo and ardo-org.
- Canonical CLI command is now `ardo`.
- Canonical config/state directory is now `~/.ardo`.
- Canonical environment variables now use `ARDO_`.
- npm package `ardo` is now canonical.
- npm package `coco` remains available as a deprecated compatibility shim.

## Before/After Mapping

| Area | Before | After |
| --- | --- | --- |
| Repository | `github.com/myty/coco` | `github.com/ardo-org/ardo` |
| Website | n/a | `https://ardo-org.github.io/ardo/` |
| CLI command | `coco` | `ardo` |
| Deno/JSR install | `jsr:@myty/coco` | `jsr:@ardo-org/ardo` |
| npm package | `coco` | `ardo` |
| Config directory | `~/.coco` | `~/.ardo` |
| PID file | `~/.coco/coco.pid` | `~/.ardo/ardo.pid` |
| Log file | `~/.coco/coco.log` | `~/.ardo/ardo.log` |
| Env prefix | `COCO_*` | `ARDO_*` |

## Upgrade Steps

1. Install the canonical CLI.

```bash
npm install -g ardo
```

Or with Deno:

```bash
deno install --global --allow-all -n ardo jsr:@ardo-org/ardo
```

2. Update scripts and automation from `coco` to `ardo`.

3. Update environment variables from `COCO_*` to `ARDO_*`.

4. Move any direct path references from `~/.coco` to `~/.ardo`.

## Compatibility Behavior

- Running `coco` still works in the compatibility window and prints a deprecation warning.
- `COCO_*` variables are still accepted as fallback when matching `ARDO_*` values are not set.
- Existing data under `~/.coco` is supported through non-destructive migration/fallback behavior.

## Deprecation Timeline

- Current series (`0.x`): compatibility mode is enabled.
- Next major (`1.0.0`): legacy `coco` command and `COCO_*` compatibility are planned for removal.

The team will announce final removal details in release notes before `1.0.0`.
