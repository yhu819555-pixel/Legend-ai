# Architecture — local-first Android app

## Boundaries
- **Android client:** Expo React Native. Stores project metadata, files, chat history and backups on the device.
- **AI provider:** App sends HTTPS requests directly to OpenAI Responses API. User supplies an API key stored at rest with Android SecureStore.
- **GitHub:** Repository stores app source. In-app GitHub OAuth and repository operations are planned separately and not implemented yet.
- **No hosted app backend:** Normal app operation does not require a Legend AI server or cloud database.

## Request flow
1. User opens a local project.
2. App reads chat history and project files from device storage.
3. App sends conversation and selected file context directly to the AI provider over HTTPS.
4. Streamed response is displayed and saved locally.
5. User can export a backup file.

## Offline behavior
Project browsing and local file management work offline. AI requests require internet and a valid provider key.

## Security trade-off
A provider key in a mobile app is not a server-only secret. SecureStore protects it at rest but cannot prevent extraction from a compromised/rooted device or modified runtime. Use a dedicated key with provider-side usage limits. Never commit keys to source control.
