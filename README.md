# MY AI AGENT

A reliability-first AI coding agent. The first release is an Android app (Expo React Native) backed by a separate API service. AI credentials stay on the backend.

## Development principles

The rules in [docs/AGENT_RULES.md](docs/AGENT_RULES.md) are mandatory. Work in small, testable stages; never mark a feature complete without passing its test.

## Repository layout

- `mobile/` — Expo React Native Android application.
- `backend/` — API service; owns secrets, persistence and provider access.
- `docs/` — architecture, security and development decisions.
- `DEVELOPMENT_STATUS.md` — source of truth for progress, blockers and test results.

## MVP sequence

1. Repository foundation and architecture.
2. Android project create/open flow with persistent local project metadata.
3. Backend project API and database migrations/backups.
4. One real AI provider with server-side credentials and streaming.
5. Project-file inspection and safe file edits.
6. Isolated command execution through a replaceable workspace provider.
7. Test-failure diagnosis/repair loop and Git commits.
8. Android build, install and acceptance verification.

Do not skip stages. Advanced providers, local AI and MCP are out of scope until the MVP acceptance tests pass.

## Current status

See [DEVELOPMENT_STATUS.md](DEVELOPMENT_STATUS.md). A scaffold or passing unit test is not proof that the complete acceptance criteria work.
