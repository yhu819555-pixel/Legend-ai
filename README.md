# Legend AI

Local-first Android AI coding workspace built with Expo React Native.

- Projects, files and chat history are stored on the phone.
- AI requests go directly from the phone to OpenAI Responses API; configure a key in Settings.
- Optional GitHub project-file sync uses a fine-grained GitHub token stored in Android SecureStore. Files are pushed/pulled under `legend-ai-projects/<project-id>/` in the selected repository branch.
- The app does not require a hosted Legend AI backend, VPS, domain or cloud database.
- AI API usage may incur charges. Mobile-stored credentials can be exposed on a compromised/rooted device; use dedicated restricted tokens and usage limits.
- GitHub sync is project-file backup, not a full git client or GitHub OAuth implementation.

See [DEVELOPMENT_STATUS.md](DEVELOPMENT_STATUS.md) for verified and pending work.
