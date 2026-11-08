# Development Status

## Implemented in source
- [x] Local-first Expo Android app: projects, chat history, settings and project text files.
- [x] Simple home screen and simplified Settings; GitHub backup is optional and collapsed by default.
- [x] App branding set to Legend AI.
- [x] Local project/chat persistence and backup JSON export/import using the Android file picker.
- [x] Android text-file import and backup sharing.
- [x] OpenAI Responses API client; each user supplies their own API key, stored in Android SecureStore.
- [x] In-app OpenAI API test with invalid-key and quota error messages.
- [x] AI project-file tools: list/read and user-approved create/update of local files.
- [x] Optional GitHub OAuth Device Flow sign-in, SecureStore token persistence and access-token refresh.
- [x] Optional GitHub repository connection test and project text-file push/pull.
- [x] No hosted Legend AI server, VPS, domain or cloud database required.

## Verification and remaining work
- [ ] Run CI and inspect tests/build for this exact revision.
- [ ] Test GitHub OAuth and real push/pull using a normal end-user account.
- [ ] Test a real OpenAI request with an end-user's own key and model.
- [ ] Install the APK on a physical Android phone and complete acceptance tests.
- [ ] Configure the publisher's GitHub OAuth App Client ID as `EXPO_PUBLIC_GITHUB_CLIENT_ID` for one-tap GitHub login in public builds.
- [ ] Add isolated code execution, command output capture and a test/repair loop. This needs a safe execution sandbox; arbitrary code must not run inside the normal app process.
- [ ] Add optional encrypted off-device backup beyond GitHub text-file sync.

## Security and cost
- OpenAI key and GitHub token are stored in Android SecureStore and never in project backups or source code. Mobile-stored credentials can still be exposed on a compromised/rooted device.
- The current GitHub OAuth flow requests `public_repo`, which grants access to all public repositories on the user's account, not only the selected repository.
- OpenAI API usage is paid separately by each user; the app does not provide free API credits.
- Local storage is not an off-device backup; users should export backup files regularly.
- GitHub sync handles project text files only. It does not sync chats/settings, create local branches, or act as a full Git client.
- Legacy backend source remains for reference; the Android app does not depend on it.
