# Security baseline — local-first app

- Never commit provider keys, GitHub tokens, private keys or user project contents.
- Store owner-provided OpenAI and GitHub credentials with Expo SecureStore.
- Mobile credentials are not server-only secrets; compromised/rooted devices or modified apps may expose them.
- Use a dedicated OpenAI key with usage limits.
- Use a fine-grained GitHub token limited to Contents read/write on the intended repository; revoke it if lost.
- All provider and GitHub requests use HTTPS.
- Treat project files and model output as untrusted input.
- Arbitrary shell/command execution is not implemented; never execute user code in the app process.
- Local data is not a backup. Export backups regularly.
