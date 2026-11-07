# Security baseline — local-first app

- Never commit real API keys, tokens, private keys, database dumps or user project contents.
- User-supplied AI API key is stored with Expo SecureStore on Android.
- A key used directly by a mobile client is not a server-only secret. A compromised/rooted device or modified app may expose it.
- Use a dedicated provider key, configure usage limits/budget alerts, and revoke it if the device is lost.
- Use HTTPS for provider requests.
- Treat project files and model output as untrusted input.
- Arbitrary shell/command execution is disabled.
- Local data is not a backup. Export backups and store them separately.
- Do not add GitHub credentials or provider keys to source code, app config, logs or backup files.
