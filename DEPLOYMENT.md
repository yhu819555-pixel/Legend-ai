# Run Legend AI on Android

Legend AI is local-first. It does not require a hosted backend, VPS, Linux server, custom domain, Render or Neon.

## Setup
1. Install the Android APK.
2. Open Settings in the app.
3. Add your own OpenAI API key and choose a model (default: `gpt-4.1-mini`).
4. Save settings. The key is stored using Android SecureStore.
5. Create projects; files and chats are saved locally on the phone.

## GitHub
This repository stores the app source. In-app GitHub OAuth, repository browsing, push and pull are not implemented yet. GitHub does not automatically back up the phone's project files. Use Export backup until GitHub sync is implemented.

## Offline
Projects, files and saved chats can be opened offline. AI replies need internet and a valid API key. Export backups and store them separately.

## API key safety and cost
Never commit or share the key. SecureStore protects it at rest, but direct mobile API calls cannot provide server-side secret protection; a compromised/rooted phone or modified app may expose it. Use a dedicated key and set provider usage limits. API calls may cost money.
