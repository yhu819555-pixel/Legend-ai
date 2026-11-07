# Security baseline

- Provider API keys and signing secrets exist only in backend environment/secret storage.
- Never commit real credentials, tokens, private keys, database dumps or user project contents.
- Use HTTPS in deployed environments; reject insecure production origins.
- Validate and authorize every project/file/command operation server-side.
- Apply request size limits, timeouts, rate limits and audit logging.
- Treat project files, prompts, tool output and model responses as untrusted input.
- Command execution is disabled until a dedicated isolated workspace provider is configured and reviewed.
- Never use shell execution in the main API process for user-supplied commands.
- Restrict workspace network access, CPU, memory, disk, runtime and lifetime; use least-privilege credentials.
- Redact secrets from logs and error responses.
- Backups must be access-controlled, encrypted at rest and periodically restore-tested.
- Before public deployment, complete an explicit threat model and dependency/security review.
