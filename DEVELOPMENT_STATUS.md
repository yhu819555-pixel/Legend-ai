# Development Status

## Local-first mobile implementation
- [x] Expo React Native app with local projects, chat history, settings and project text-file manager.
- [x] Local project and chat persistence on Android.
- [x] Local backup export/share and validated restore.
- [x] Native Android text-file and JSON backup import/export.
- [x] API key and model settings stored with Expo SecureStore.
- [x] Mobile chat client calls OpenAI Responses API directly; no Legend AI backend URL/token required by the app.
- [x] Project files are sent as untrusted context with chat requests.
- [x] Setup and architecture docs updated for local-first operation.

## Not yet implemented or verified
- [ ] Run CI for this revision and inspect all test/build results.
- [ ] Verify a fresh Android APK artifact for this exact commit.
- [ ] Test a real OpenAI API request with the owner's key and model.
- [ ] Complete physical Android installation and acceptance tests.
- [ ] Implement GitHub sign-in/OAuth and in-app repository clone/pull/push/commit.
- [ ] Add safe local code execution with output capture and a test/repair loop.
- [ ] Add optional encrypted off-device backup/sync.

## Security and cost
- API key is stored in Android SecureStore and is never committed. A client-side key is still less protected than a server-side secret; a compromised/rooted device may expose it.
- Use a dedicated key and provider-side usage limits. API calls may incur charges.
- Local storage is not an off-device backup. Export backups regularly.
- GitHub currently hosts this app's source; in-app GitHub sync is not yet implemented.
- Legacy `backend/` source remains for reference, but the Android app no longer depends on it.

## Test policy
Only mark CI, live AI, APK and physical-device checks complete after each has actually passed.
