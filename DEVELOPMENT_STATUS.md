# Development Status

## Completed features
- [x] GitHub repository connection and write access verified.
- [x] Stability rules and MVP acceptance criteria documented.
- [x] Architecture and security boundaries documented.
- [x] Environment template contains placeholders only; no credentials.
- [x] Expo React Native Android app scaffold added.
- [x] Local project create/open flow with AsyncStorage persistence added.
- [x] Project persistence and project creation actions extracted into testable helpers.
- [x] Mobile project persistence unit tests added (5 cases).
- [x] Project creation action tests added (3 cases); CI verification pending.
- [x] Backend Node.js HTTP service scaffold and health endpoint added.
- [x] Backend route tests added (2 cases).
- [x] Server-side OpenAI Responses API streaming adapter added, with input validation, upstream error handling and secret-safe errors.
- [x] OpenAI provider adapter unit tests added (4 cases).
- [x] CI expanded to run backend tests, mobile tests, Expo doctor, Android JS bundle export, native debug APK build and emulator launch smoke test.

## Pending features
- [ ] Confirm the latest CI run passes the expanded mobile tests, APK build and emulator install/launch smoke test.
- [ ] Download and inspect the debug APK artifact after the latest green CI run; physical installation remains to be verified.
- [ ] Confirm automated Android emulator install/launch smoke test passes; manually verify UI interactions.
- [x] Add bearer-token authentication gate for the streaming chat API route. Full user identity, per-user authorization and token lifecycle remain pending.
- [ ] Add database, versioned migrations, backup and restore tests.
- [ ] Implement server-side project persistence and sync.
- [ ] Configure an OpenAI API key only in backend secret storage and verify a live provider request.
- [x] Add authenticated `/v1/chat/stream` API route with message validation, bounded request body, SSE relay, disconnect cancellation and safe provider errors; route tests added.\n- [ ] Configure backend `APP_API_TOKEN` and `AI_API_KEY`, then verify a live provider request.\n- [ ] Wire the authenticated streaming route into the Android chat UI; implement client-side retry/error handling and end-to-end tests.
- [ ] Implement real project-file inspection and safe file create/edit operations.
- [ ] Select and verify an isolated workspace provider before enabling command execution.
- [ ] Capture command output and implement test-failure diagnosis/repair.
- [ ] Implement Git commit integration.
- [ ] Run complete MVP acceptance suite, including persistence across app restarts and no-secret exposure.

## Known bugs / limitations
- The mobile project list is stored locally on the device; it is not synced to the backend.
- A real app-flow bug was found during source review: the screen handler shadowed the imported project factory. The handler was renamed and the create/save flow extracted into a tested action; expanded CI verification is pending.
- The workspace screen is an explicit placeholder; AI chat, file tools and command runner are not implemented.
- The backend exposes health and an authenticated SSE chat route. The route is covered by mocked provider tests; live credentials and Android client integration are not configured.
- No database, cloud workspace provider, provider credentials, APK or physical-device test is configured.
- The mobile test suite currently tests project storage helpers, not rendered UI behavior.

## Test results
- Previous combined verification: PASS (2 backend + 5 mobile unit tests; 7 total, 0 failures).
- Expanded verification before chat route: 6 backend + 8 mobile unit tests (14 total). Authenticated chat route tests have now been added; matching GitHub CI is pending.
- Previous backend CI run: PASS (2 backend tests).
- Mobile unit tests: PASS (5/5 locally; CI run also reported 5/5 on the first combined run).
- Expo dependency compatibility / doctor: PASS after correcting React Native from 0.81.4 to SDK-required 0.81.5.
- Android JavaScript bundle export: PASS in corrected CI.
- Android native prebuild: PASS. Android SDK setup: PASS after removing obsolete default `tools` package. Debug APK build: PASS in CI.
- Emulator install succeeded in an earlier run, but its process-check shell script failed due to a multiline-shell invocation issue. The check was simplified to a single command; latest emulator verification is pending.
- Physical-device install: pending.
- OpenAI adapter unit tests: PASS (4/4); live provider request and client streaming: NOT RUN (backend secret and authenticated route are not configured).
- File tools / isolated execution / Git commit: NOT IMPLEMENTED, NOT RUN.
- No test result is marked PASS until the corresponding CI job or device test completes successfully.

## Current working stage
Stage 2 — Android project create/open and local persistence, plus backend health foundation. The Android debug APK now builds in CI; emulator launch and expanded project-action test verification remain in progress.

## Required credentials / decisions
- Choose one AI provider and add its API key to backend secret storage only.
- Choose backend hosting and a database provider; confirm costs and limits.
- Choose an isolated workspace execution provider; confirm isolation guarantees, quotas and pricing.
- Provide Android device or emulator access for launch and APK installation verification.

## Checkpoint policy
Create a Git checkpoint after each stage that has actually passed its tests. Committed scaffolding alone does not mean a stage passed.
