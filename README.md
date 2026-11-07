# Legend AI

A local-first Android AI coding workspace built with Expo React Native.

## How it works
- **Phone storage:** Projects, project files, chat history and backup data stay on the Android device.
- **GitHub:** This repository stores the app source code. In-app GitHub sign-in and repository sync are not implemented yet.
- **AI API:** The app sends requests directly from the phone to the OpenAI Responses API using the owner's API key stored in Android SecureStore.
- **No hosting server:** Normal app operation needs no Legend AI backend, VPS, domain, Render service or hosted database.
- **Offline:** Local projects and files can be viewed and edited offline. AI replies require internet and a working API key.

## Security and cost
The key is not committed to GitHub. SecureStore protects it at rest, but a key used by a client app is not equivalent to a server-side secret and may be exposed on a compromised/rooted device. Use a dedicated key and provider-side usage limits. API usage is billed separately; the app does not provide free API credits.

See [DEVELOPMENT_STATUS.md](DEVELOPMENT_STATUS.md) for verification status.
