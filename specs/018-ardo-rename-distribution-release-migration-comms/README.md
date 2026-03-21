---
status: complete
created: 2026-03-21
priority: high
tags:
- rename
- distribution
- release
- migration
- changelog
depends_on:
- 015-ardo-rename-core-runtime-cli
- 016-ardo-rename-config-env-migration
- 017-ardo-rename-repo-docs-branding
parent: 014-coco-to-ardo-rename
created_at: 2026-03-21T02:09:18.098785Z
updated_at: 2026-03-21T02:33:04.347452Z
completed_at: 2026-03-21T02:33:04.347452Z
transitions:
- status: in-progress
  at: 2026-03-21T02:26:17.285741Z
- status: complete
  at: 2026-03-21T02:33:04.347452Z
---

# Ardo Rename Child: Distribution, Release, and Migration Communication

## Overview

Complete rename across package distribution channels and release workflows, and publish migration communication assets for users upgrading from Coco to Ardo.

## Design

This child spec covers publishing identity and upgrade communications:

- package naming and metadata changes where required
- release artifact naming (archives, checksums, installers)
- CI/release pipeline references to new identity
- old package/channel deprecation or redirect strategy
- changelog rename entry and root migration guide

## Plan

- [x] Inventory package/release identifiers that include Coco naming.
- [x] Update package metadata and distribution references to Ardo identity.
- [x] Update release pipeline/workflow references and artifact naming.
- [x] Define and implement deprecation or redirect behavior for legacy package names.
- [x] Add changelog entry covering rename impact and compatibility.
- [x] Author `MIGRATION.md` with before/after mappings and upgrade steps.

## Test

- [x] Release dry-run produces Ardo-named artifacts.
- [x] Package install docs and metadata resolve correctly.
- [x] Legacy package/channel behavior (redirect/deprecation) is explicit and validated.
- [x] `MIGRATION.md` exists and is linked from key docs.

## Notes

Maps from umbrella requirements: R-018, R-019, R-020, R-021, R-022.