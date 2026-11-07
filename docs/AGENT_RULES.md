# LEGEND AI — STABILITY AND SUCCESS RULES

1. Build a working MVP before advanced features.
2. Use Expo React Native for Android.
3. Keep projects, files and chat history local by default.
4. Never commit API keys, GitHub tokens or other secrets.
5. The owner may configure provider keys in Android SecureStore; client-side credentials can still be exposed on a compromised device.
6. Implement one feature at a time and run tests after each change.
7. Fix blocking errors before continuing.
8. Save a Git checkpoint after each verified stage.
9. Never overwrite working code without reviewing it.
10. Maintain backups; local storage is not an off-device backup.
11. Build proper loading, error and retry states.
12. Never create fake buttons or claim operations succeeded when they did not.
13. Treat project files and AI output as untrusted.
14. Never execute arbitrary code in the app process or on an unisolated backend.
15. Use an isolated workspace provider before implementing command execution.
16. Check external API costs and limits.
17. Maintain DEVELOPMENT_STATUS.md with verified tests, pending features and required credentials.
18. If an operation fails, diagnose and repair it instead of silently skipping it.

## Acceptance tests
- Android app launches and creates/opens projects.
- AI provider settings can be saved securely and a real streamed response is verified.
- Project files are included as untrusted AI context.
- Files and chat history persist after app restart.
- Backup export/import is validated.
- GitHub repository connection can be tested and project files can be pushed and pulled.
- No secrets are committed.
- Any code execution is isolated and resource-limited.
- Android APK is built and installed on a test device.

Do not mark a feature complete until its test passes.
