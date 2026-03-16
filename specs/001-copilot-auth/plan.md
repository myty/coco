## Plan

### Summary

Implement GitHub Copilot authentication for Claudio using the Copilot SDK's
built-in auth. The CLI runs on Deno, leveraging the SDK's device flow handling.
Authentication tokens are cached securely using platform-native storage. The
implementation prioritizes minimal startup time and minimal output to maintain
terminal performance.

### Project Structure

#### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

#### Source Code (repository root)

```text
src/
├── auth/
│   ├── mod.ts           # Auth module exports
│   └── copilot.ts       # Copilot SDK auth integration
├── cli/
│   └── main.ts          # CLI entry point
└── lib/
    ├── token.ts         # Token storage utilities
    └── errors.ts        # Error types

tests/
└── auth/
    └── auth_test.ts     # Auth unit tests

deno.json                # Deno config (permissions, imports)
```

### Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation                  | Why Needed         | Simpler Alternative Rejected Because |
| -------------------------- | ------------------ | ------------------------------------ |
| [e.g., 4th project]        | [current need]     | [why 3 projects insufficient]        |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient]  |
