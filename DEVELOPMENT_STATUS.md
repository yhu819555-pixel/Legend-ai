# Development Status

## Completed features
- [x] GitHub repository connection and write access verified.
- [x] Stability rules and MVP acceptance criteria documented.
- [x] Architecture and security boundaries documented.
- [x] Environment template contains placeholders only; no credentials.
- [x] Expo React Native Android app scaffold added.
- [x] Local project create/open flow with AsyncStorage persistence added.
- [x] Project persistence extracted into testable helpers.
- [x] Mobile project persistence unit tests added (5 cases).
- [x] Backend Node.js HTTP service scaffold and health endpoint added.
- [x] Backend route tests added (2 cases).
- [x] CI expanded to run backend tests, mobile tests, Expo doctor and Android JS bundle export.

## Pending features
- [ ] Confirm latest full Project CI run passes all jobs.
- [ ] Produce a signed/unsigned Android APK or AAB with a native build pipeline.
- [ ] Launch app on Android emulator/device and verify UI interactions.
- [ ] Add backend authentication and authorization.
- [ ] Add database, versioned migrations, backup and restore tests.
- [ ] Implement server-side project persistence and sync.
- [ ] Select and verify one real AI provider; configure its key only in backend secret storage.
- [ ] Implement end-to-end AI streaming and retry/error handling.
- [ ] Implement real project-file inspection and safe file create/edit operations.
- [ ] Select and verify an isolated workspace provider before enabling command execution.
- [ ] Capture command output and implement test-failure diagnosis/repair.
- [ ] Implement Git commit integration.
- [ ] Run complete MVP acceptance suite, including persistence across app restarts and no-secret exposure.

## Known bugs / limitations
- The mobile project list is stored locally on the device; it is not synced to the backend.
- The workspace screen is an explicit placeholder; AI chat, file tools and command runner are not implemented.
- The backend currently exposes only a health endpoint; no user data or AI provider calls are implemented.
- No database, cloud workspace provider, provider credentials, APK or physical-device test is configured.
- The mobile test suite currently tests project storage helpers, not rendered UI behavior.

## Test results
- Previous backend CI run: PASS (2 backend tests).
- Mobile unit tests: added; latest full CI result pending.
- Expo dependency compatibility / doctor: pending latest full CI.
- Android JavaScript bundle export: pending latest full CI.
- Android native APK build / emulator launch / physical installation: NOT RUN.
- AI streaming / file tools / isolated execution / Git commit: NOT IMPLEMENTED, NOT RUN.
- No test result is marked PASS until the corresponding CI job or device test completes successfully.

## Current working stage
Stage 2 — Android project create/open and local persistence, plus backend health foundation. Verification is being expanded to cover backend and mobile code together.

## Required credentials / decisions
- Choose one AI provider and add its API key to backend secret storage only.
- Choose backend hosting and a database provider; confirm costs and limits.
- Choose an isolated workspace execution provider; confirm isolation guarantees, quotas and pricing.
- Provide Android device or emulator access for launch and APK installation verification.

## Checkpoint policy
Create a Git checkpoint after each stage that has actually passed its tests. Committed scaffolding alone does not mean a stage passed.
