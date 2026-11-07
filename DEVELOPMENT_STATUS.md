# Development Status

## Completed implementation (automated verification pending for newest commits)
- [x] GitHub repository connection and write access verified.
- [x] Expo React Native Android app scaffold and local project create/open flow with AsyncStorage persistence.
- [x] Android chat UI, per-project local chat history, backend URL settings and secure access-token storage.
- [x] Local project text-file manager with create, edit and delete; bounded file context is sent as untrusted AI context.
- [x] Backend Node.js HTTP service with authenticated OpenAI Responses API SSE relay, request limits and disconnect cancellation.
- [x] PostgreSQL schema for projects, project files and chat messages, plus startup migration runner and transactional project updates.
- [x] Authenticated backend project API for listing, creating, reading, updating and deleting projects.
- [x] Android cloud-sync client for project lists, project files and chat history, retaining local data when cloud access is unavailable.
- [x] Dockerfile and Docker Compose deployment scaffold with PostgreSQL health checks, persistent DB volume and private environment secrets.
- [x] Backend and mobile unit tests, plus GitHub Actions workflow for tests, Expo checks, Android bundle export and APK build.

## Pending implementation / external setup
- [ ] Confirm the latest GitHub Actions run passes after PostgreSQL and mobile cloud-sync changes; verify the new APK artifact.
- [ ] Deploy Docker Compose to a user-controlled server with HTTPS and persistent storage.
- [ ] Set private `POSTGRES_PASSWORD`, `APP_API_TOKEN`, and `AI_API_KEY` values in the deployment environment. Never commit or paste real secrets into chat.
- [ ] Run database migration and verify live OpenAI Responses API call with the user's enabled model and key.
- [ ] Add real user identity, per-user project authorization and token lifecycle; current backend token is a single shared credential.
- [ ] Add downloadable import/export backup and actual Android folder/document access outside the app's local text-file workspace.
- [ ] Select and verify an isolated workspace provider before enabling file writes and command execution.
- [ ] Implement safe isolated command execution, output capture and test-failure diagnosis/repair loop.
- [ ] Implement authenticated Git provider integration and commits.
- [ ] Run complete MVP acceptance suite and physical Android device interaction tests.
- [ ] Configure encrypted off-host PostgreSQL backups and test restore.

## Known limitations
- Cloud database and mobile sync code are implemented but not live until a server, database and secrets are configured.
- The current backend uses one shared app token; it is not a multi-user identity system.
- The app's file manager currently stores text files inside app storage. It is not yet a native folder browser or remote workspace.
- AI can inspect supplied files but cannot yet safely write files or run commands in an isolated workspace.
- Command execution is intentionally disabled: arbitrary user code must never run in the main API process.
- A passing CI APK build does not prove live AI, production deployment or installation and interaction on a physical phone.

## Test policy
- Mark a test PASS only after the corresponding CI job or device test completes successfully.
- A build artifact is not verified until the current workflow uploads it and its contents are checked.
