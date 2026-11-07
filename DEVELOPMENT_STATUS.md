# Development Status

## Implemented in the repository
- [x] Expo React Native Android app with local projects, chat history, settings and project text-file manager.
- [x] Secure device storage for the backend access token.
- [x] Authenticated Node.js API with OpenAI Responses API streaming, bounded request validation and cancellation.
- [x] PostgreSQL schema, ordered chat messages, migrations and transactional project updates.
- [x] Authenticated project API for project metadata, files and chat history.
- [x] Mobile cloud project list, pull and snapshot sync helpers; local data remains usable when cloud is unavailable.
- [x] Local backup export/share and validated backup restore.
- [x] Native Android text-file and JSON backup import, plus backup sharing/export.
- [x] Docker Compose stack with private PostgreSQL, backend-only internal port, Caddy automatic HTTPS reverse proxy and persistent volumes.
- [x] Deployment guide and private environment template.
- [x] Backend/mobile tests and CI workflow for Docker config, backend image, Expo checks, Android bundle and debug APK.

## Not yet verified or implemented
- [ ] Confirm CI run for the latest source and inspect the generated APK artifact.
- [ ] Deploy on a real server after the owner supplies/configures a DNS domain and private server environment values.
- [ ] Run a live database migration and real OpenAI Responses API request with the owner's enabled model and key.
- [ ] Replace the single shared backend token with real per-user identity, project ownership/authorization and token rotation before any multi-user exposure.
- [ ] Add a general downloadable project archive/folder workflow beyond the current text-file import and JSON backup export.
- [ ] Select and review an isolated workspace execution provider; implement safe file writes, command execution, output capture and test/repair loop only inside that isolation boundary.
- [ ] Implement Git provider authorization and repository operations/commits.
- [ ] Configure encrypted off-host database backups and verify a restore.
- [ ] Complete physical Android device installation, interaction, offline/reconnect and acceptance tests.

## Security and deployment limits
- The shared app token is suitable only for a private single-owner MVP deployment, not a public multi-user product.
- The AI provider key must remain on the server and is never embedded in the APK.
- AI currently receives supplied project files as untrusted read-only context; arbitrary command execution and workspace writes are intentionally disabled.
- The PostgreSQL Docker volume is persistence, not a backup.
- A successful CI run or APK build does not prove a live deployment, live AI request or physical-device acceptance.

## Test policy
- Mark a test PASS only after the corresponding CI job or device test completes successfully.
- Mark production deployment and live AI complete only after real external configuration and end-to-end verification.
