# Deploy Legend AI backend with HTTPS

This runs the API, PostgreSQL and Caddy reverse proxy. It does not deploy the Android app.

## Requirements

- A Linux server with Docker Engine and the Docker Compose plugin.
- A DNS name (for example, `api.example.com`) with A/AAAA records pointing to this server.
- Inbound TCP ports 80 and 443 allowed by the server firewall. UDP 443 is optional (HTTP/3).
- A valid OpenAI API key and an enabled model.

## 1. Configure secrets

Copy `.env.example` to `.env` in the repository root. Set `DOMAIN`, a unique long random `POSTGRES_PASSWORD`, a separate random `APP_API_TOKEN`, `AI_API_KEY`, and an enabled `AI_MODEL`. Keep the file private:

```sh
cp .env.example .env
chmod 600 .env
```

Do not commit `.env`, put the provider key in the APK, or paste credentials into chat. The repository's `.gitignore` excludes local environment files.

## 2. Start the stack

After DNS is pointing to the server and ports 80/443 are reachable:

```sh
docker compose config
docker compose up -d --build
docker compose ps
docker compose logs -f caddy backend
```

Caddy obtains and renews HTTPS certificates automatically. The backend port 8080 is only exposed inside the private Compose network; public API traffic enters through Caddy on 443. The API health endpoint is `/health`. Database migrations run on backend startup.

## 3. Connect the Android app

In Legend AI Settings, enter `https://YOUR_DOMAIN` and the exact `APP_API_TOKEN` from the private server environment. The OpenAI key remains server-side.

## 4. Backups and operations

The `legend_ai_postgres` volume is persistent storage, not a backup. Configure encrypted off-host PostgreSQL backups and regularly test restoring them. Protect the server, keep Docker and images updated, monitor disk usage and logs, and rotate secrets if they are exposed.

## Important MVP security limits

- The backend currently uses one shared app token. It is not per-user identity, account isolation or token lifecycle management. Do not use this as a public multi-user service.
- Cloud project APIs and mobile sync are implemented, but require a live configured server to operate.
- AI calls are not considered live-tested until a real request succeeds with the configured provider key and model.
- AI can inspect project files; safe file writes, isolated command execution, automated repair and Git commits are not enabled. They require an isolated workspace and explicit Git authorization.
- A passing CI build does not replace installation and interaction tests on a physical Android device.
