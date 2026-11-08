# Legend AI

A simple, local-first Android AI workspace built with Expo React Native.

## For every user
- Each person can use their own OpenAI API key in Settings. No Legend AI account, shared owner account, VPS, domain, hosted backend or cloud database is required.
- API keys are stored in Android SecureStore and are never included in project backups or GitHub source.
- Projects, chats and project files stay on the phone and remain available offline.
- Create projects, chat with AI, browse/edit files, and export/import a backup file.

## AI coding
- AI can list and read local project files.
- AI can create or update files after asking for approval in the app.
- AI requests go directly from the phone to the OpenAI Responses API. Internet and the user's own API billing/credits are required for AI responses.
- The current mobile agent does not execute arbitrary code or run shell commands. Safe isolated execution and an automated test/repair loop are not implemented yet.

## Optional GitHub backup
- GitHub is optional; the app works without connecting it.
- GitHub sync backs up project text files under `legend-ai-projects/<project-id>/`; it is not a full Git client or a backup of chats/settings.
- For a public release with a one-tap GitHub login, the publisher must register a GitHub OAuth App, enable Device Flow, and set `EXPO_PUBLIC_GITHUB_CLIENT_ID` during the build. Without that build setting, GitHub backup remains optional and requires a Client ID in advanced settings.
- The current OAuth flow requests `public_repo`, which can access all public repositories for the authorizing account. Do not imply it is restricted to one repository.

## Costs and security
- OpenAI API usage may incur charges for each user. ChatGPT subscriptions do not include API credits.
- Never share API keys or commit them to GitHub. Mobile-stored credentials may be exposed on compromised/rooted devices.
- Local storage is not an off-device backup; export backup files regularly.

See [DEVELOPMENT_STATUS.md](DEVELOPMENT_STATUS.md) for verified and pending work.
