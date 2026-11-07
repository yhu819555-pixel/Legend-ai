# MY AI AGENT — STABILITY AND SUCCESS RULES

These rules govern all development and have priority over feature requests.

1. Build a working MVP first. Do not attempt every advanced feature simultaneously.
2. Use stable, compatible and maintained dependencies.
3. Use Expo React Native for the Android application.
4. Keep backend and Android frontend separate.
5. Never put API keys or secrets inside the mobile application.
6. Implement one feature at a time.
7. After every feature, run tests and verify actual functionality.
8. Fix all blocking errors before continuing.
9. Save a Git checkpoint after every successfully completed stage.
10. Never overwrite working code without reviewing it.
11. Maintain a working project backup.
12. Use database migrations and backups.
13. Build proper loading, error and retry states.
14. Never create fake buttons or simulated successful operations.
15. Use real AI APIs and real project tools.
16. Implement cloud execution using an isolated workspace provider.
17. Never execute arbitrary user code on the main backend server.
18. Start with one verified AI provider. Add more only after the first works.
19. Do not implement local AI in the first release.
20. Do not implement MCP or complex integrations until the core agent works.
21. Keep all external services replaceable.
22. Check API limits, hosting limits and build costs before using external services.
23. Do not claim a feature is complete until its test passes.
24. Maintain `DEVELOPMENT_STATUS.md` with completed features, pending features, known bugs, test results, current stage and required credentials.
25. If an operation fails, diagnose and repair it instead of silently skipping it.

## Acceptance tests

The first release is accepted only when:

- Android app launches.
- User can create and open a project.
- User can connect a real AI provider.
- AI responds using streaming.
- AI can inspect actual project files.
- AI can create and edit files.
- AI can run an allowed command in an isolated workspace.
- AI can read command output.
- AI can identify and repair a test failure.
- Changes persist after closing and reopening the project.
- Git commit works.
- No secrets are exposed.
- A successful Android APK build is produced and installed on a test device.

If a test fails, fix it and rerun it. Do not move to advanced features until MVP acceptance tests pass.
