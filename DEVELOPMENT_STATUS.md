# Development Status

## Completed features
- [x] GitHub repository connection and write access verified.
- [x] Stability rules, MVP acceptance criteria, architecture and security boundaries documented.
- [x] Expo React Native Android app scaffold and local project create/open flow with AsyncStorage persistence.
- [x] Backend Node.js HTTP service, health endpoint and server-side OpenAI Responses API streaming adapter.
- [x] Authenticated \`POST /v1/chat/stream\` route with bearer-token authentication, bounded request body, validation, SSE relay and disconnect cancellation.
- [x] Android chat screen with per-project local chat history, backend URL settings and secure token storage.
- [x] SSE client can render response deltas incrementally when the platform exposes a readable response stream; it falls back to completed response text otherwise.
- [x] Local project text-file manager with create, edit, delete and per-project persistence.
- [x] Project file contents are sent as bounded, untrusted context to the AI; server rejects path-like names and oversized context.
- [x] Backend tests cover auth, request validation, SSE relay and safe project context.
- [x] Mobile unit tests cover project persistence, chat client and project file storage.

## Pending features
- [ ] Confirm CI passes after project file context and navigation changes; verify the latest APK artifact.
- [ ] Configure/deploy backend and set \`APP_API_TOKEN\` and \`AI_API_KEY\` as server-side secrets.
- [ ] Verify live AI response from a physical Android device.
- [ ] Add database, migrations, cloud project persistence, backup and restore.
- [ ] Add user identity, per-user authorization and token lifecycle.
- [ ] Add import/export and access to actual project folders/files outside the app's local text-file workspace.
- [ ] Select and verify an isolated workspace provider before enabling command execution.
- [ ] Implement safe command execution, output capture and test-failure diagnosis/repair.
- [ ] Implement Git commit integration.
- [ ] Run complete MVP acceptance suite and physical-device interaction tests.

## Known limitations
- Project files and chat history are local app text records, not a mounted OS folder or remote workspace.
- The backend passes supplied project text as read-only AI context; it cannot yet directly write files on a workspace provider.
- Command execution is intentionally not implemented: arbitrary code must not run on the backend host, and no isolated workspace provider has been selected.
- No database/cloud sync, live provider credentials or physical-device test is configured.
- CI APK success does not prove installation and interaction on the user's phone.

## Test policy
- Mark a test PASS only after the corresponding CI job or device test completes successfully.
- A build artifact is not considered verified until the current workflow has uploaded it and its contents have been checked.
