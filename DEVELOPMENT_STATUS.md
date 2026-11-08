# Development Status

## Implemented in source
- [x] Local-first Expo Android app: projects, chat history, settings and project text files.
- [x] Local project/chat persistence and backup JSON export/import.
- [x] Android file import and backup sharing.
- [x] OpenAI Responses API client; API key stored in Android SecureStore.
- [x] AI project-file tools: list/read and user-approved create/update of local files.
- [x] GitHub OAuth Device Flow sign-in, SecureStore token persistence and automatic access-token refresh (requires a registered OAuth App Client ID with Device Flow enabled).
- [x] GitHub repository connection test, including automatic default-branch selection.
- [x] Push project text files to `legend-ai-projects/<project-id>/` in a configured branch.
- [x] Pull project text files from the same repository folder.
- [x] Local-first architecture no longer requires a hosted Legend AI server.

## Verification and remaining work
- [ ] Run CI and inspect tests/build for this exact revision.
- [ ] Test GitHub connection and real push/pull with the owner's fine-grained token.
- [x] Add in-app OpenAI API test with clear invalid-key and quota errors.
- [ ] Test a real OpenAI request with the owner's key and chosen model.
- [ ] Install APK on a physical Android phone and complete acceptance tests.
- [ ] Add isolated code execution, command output capture and test/repair loop.
- [ ] Register the Legend AI OAuth App and configure its Client ID in the app; complete real device authorization test.
- [ ] Add optional encrypted off-device backup beyond GitHub text-file sync.

## Security and cost
- OpenAI key and GitHub token are stored in Android SecureStore, never in source code. A mobile app credential is not a server-only secret and may be exposed on compromised/rooted devices.
- GitHub token should be fine-grained and limited to Contents read/write on the intended repository.
- API usage can incur provider charges. Set usage limits.
- Local storage is not a backup; export backups regularly.
- GitHub sync currently handles project text files only; it is not a full Git client, does not create local branches or perform arbitrary git commits for the whole app.
- Legacy backend source remains for reference; the Android app does not depend on it.
