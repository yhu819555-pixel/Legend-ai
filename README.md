# Legend AI

Local-first Android AI coding workspace built with Expo React Native.

- Projects, files and chat history are stored on the phone.
- AI requests go directly from the phone to OpenAI Responses API; configure a key in Settings.
- Optional GitHub project-file sync uses GitHub OAuth Device Flow (OAuth App Client ID required once) and stores the resulting access token in Android SecureStore. For this public repository it requests `public_repo` scope. Files are pushed/pulled under `legend-ai-projects/<project-id>/` in the selected repository branch.
- The app does not require a hosted Legend AI backend, VPS, domain or cloud database.
- AI API usage may incur charges. Mobile-stored credentials can be exposed on a compromised/rooted device; use dedicated restricted tokens and usage limits.
- GitHub sync is project-file backup, not a full git client. OAuth App registration and enabling Device Flow are required before first sign-in.

See [DEVELOPMENT_STATUS.md](DEVELOPMENT_STATUS.md) for verified and pending work.
