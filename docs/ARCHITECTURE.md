# Architecture (MVP)

## Boundaries

- **Android client:** Expo React Native. It presents projects, chat and file/command results. It must not contain provider keys.
- **Backend API:** authenticates users, stores project metadata, talks to the selected AI provider and streams responses to the client.
- **Database:** server-side relational database with versioned migrations and tested backups.
- **Workspace provider:** replaceable adapter that provisions an isolated workspace per project/session. User code must never run in the API process or on its host outside that isolation boundary.
- **Git provider:** explicit, auditable commits against a project workspace/repository.

## Request flow

1. Android client calls the backend over HTTPS.
2. Backend validates identity, authorization, input size and rate limits.
3. Backend loads project context from persistent storage/workspace.
4. Provider adapter sends the request using a server-side secret.
5. Streaming events are relayed to the client; disconnects and provider errors are handled.
6. File changes and command execution require policy checks and workspace isolation.
7. Successful changes are persisted and can be committed to Git.

## MVP sequencing

Do not wire cloud execution until an isolation provider has been selected and its security boundary has been verified. Do not claim real AI streaming until an actual provider credential is configured and an end-to-end streaming test passes.

## Replaceable interfaces

Keep AI provider, database, workspace execution and Git integration behind backend interfaces. Avoid coupling mobile UI to a specific vendor.
