# Development Status

## Completed features
- [x] GitHub repository connection and write access verified.
- [x] Stability rules, MVP acceptance criteria, architecture and security boundaries documented.
- [x] Expo React Native Android app scaffold and local project create/open flow with AsyncStorage persistence.
- [x] Project persistence and creation helpers extracted and unit tested.
- [x] Backend Node.js HTTP service, health endpoint and server-side OpenAI Responses API streaming adapter.
- [x] Authenticated \`POST /v1/chat/stream\` route with bearer-token gate, bounded body, message validation, SSE relay and disconnect cancellation.
- [x] Backend route/provider tests and mobile project tests.
- [x] Android CI pipeline exports the JS bundle and builds a debug APK when the workflow completes.
- [x] Android chat screen added and wired to the authenticated backend endpoint.
- [x] Chat history is saved per project on the device.
- [x] Backend URL and app access token settings screen added; token uses Expo SecureStore.
- [x] Chat client validates connection settings, sends bearer auth, parses SSE output and surfaces common backend errors.
- [x] Tests added for SSE parsing and chat client request behavior.

## Pending features
- [ ] Confirm CI passes after the chat UI, SecureStore dependency and test changes; verify APK artifact.
- [ ] Configure/deploy backend and set \`APP_API_TOKEN\` and \`AI_API_KEY\` as server-side secrets.
- [ ] Verify a live provider request from a physical Android device.
- [ ] Add database, migrations, cloud project persistence, backup and restore.
- [ ] Add server-side project/user identity, authorization and token lifecycle.
- [ ] Implement project-file inspection and safe file create/edit operations.
- [ ] Select and verify an isolated workspace provider before enabling command execution.
- [ ] Capture command output and implement test-failure diagnosis/repair.
- [ ] Implement Git commit integration.
- [ ] Run complete MVP acceptance suite, including persistence across app restarts and no-secret exposure.

## Known limitations
- Chat response text is parsed after the HTTP response completes; the current mobile client does not yet render token-by-token live updates.
- Chat history and projects are stored locally on the device, not synced to a server or database.
- The workspace can chat only after a reachable backend URL, matching app token, and server-side AI key are configured.
- No live provider call has been made; CI uses mocked provider responses.
- File editing, isolated command execution, automated repair, Git operations and cloud sync are not implemented.
- A successful CI APK build does not replace physical-device installation and interaction testing.

## Test policy
- Mark a test PASS only after the corresponding CI job or device test completes successfully.
- A build artifact is not considered verified until the current workflow has uploaded it and its contents have been checked.
