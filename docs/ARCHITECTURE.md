# Architecture — local-first Android app

- Android app stores projects, project text files, chat history and backups on device.
- OpenAI Responses API is called directly over HTTPS using an owner-supplied API key stored at rest with Android SecureStore.
- Optional GitHub sync uses a fine-grained token stored in SecureStore and GitHub Contents REST API. Project files live in `legend-ai-projects/<project-id>/` on the configured branch.
- No hosted Legend AI backend or database is required for normal operation.

GitHub sync is a file-level backup mechanism, not full git clone/commit/branch functionality. It does not automatically delete remote files removed locally. Pull merges by filename and does not silently delete local files.

SecureStore protects values at rest but cannot guarantee secrecy on compromised/rooted devices. Use dedicated credentials with minimum permissions and revoke lost-device tokens.
