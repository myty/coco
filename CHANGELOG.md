# Changelog

All notable changes to this project are documented in this file.

## 0.2.0 - 2026-03-21

### Changed

- Renamed project identity from Coco to Ardo across runtime, docs, and
  distribution assets.
- Switched canonical CLI command from `coco` to `ardo`.
- Switched canonical config/state path from `~/.coco` to `~/.ardo`.
- Switched canonical environment prefix from `COCO_*` to `ARDO_*`.
- Updated release artifacts and npm distribution pipeline to Ardo naming.

### Added

- Added compatibility fallback for legacy Coco paths and environment variables.
- Added root migration guide: [MIGRATION.md](MIGRATION.md).

### Deprecated

- Legacy Coco compatibility (`coco` command and `COCO_*` variables) will be
  removed in `1.0.0`.
