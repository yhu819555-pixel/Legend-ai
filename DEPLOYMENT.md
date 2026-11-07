# Self-host Legend AI backend

This deploys the API and PostgreSQL on a machine with Docker Compose. It does not deploy the Android app.

## 1. Prepare private secrets

On the server, create a private `.env` file in the repository root. Do not commit it or share its values in chat.

```dotenv
POSTGRES_PASSWORD=generate-a-long-random-password
APP_API_TOKEN=generate-a-different-long-random-token
AI_API_KEY=your-provider-api-key
AI_MODEL=your-enabled-model-id
```

Use different random values for the database password and app token. Keep the file readable only by the deployment account (for example, `chmod 600 .env`). The provider key belongs only in this backend environment, never in the APK.

## 2. Start services

```sh
docker compose up -d --build
docker compose ps
docker compose logs -f backend
```

The backend runs database migrations on startup. Its health endpoint is `/health`. The API listens on port 8080.

## 3. Configure Android

In the app's Settings screen, enter the backend's HTTPS URL and the exact `APP_API_TOKEN` value from the server's private environment.

Do not expose port 8080 directly to the public internet without a TLS reverse proxy, firewall, rate limiting and an appropriate deployment review. Use HTTPS in the Android app.

## 4. Backups

The named Docker volume `legend_ai_postgres` stores database data. Configure encrypted, off-host PostgreSQL backups and periodically test restoring them. A Docker volume alone is not a backup.

## Current deployment limits

- The current app token is a single shared backend credential, not per-user identity or authorization.
- Project API routes and PostgreSQL storage are implemented as a backend foundation; mobile cloud-sync UI is still pending.
- AI calls require a valid provider key and enabled model. No live provider request is claimed until tested with the user's configured key.
- Command execution and Git workspace operations remain disabled until an isolated workspace provider and Git authorization flow are selected and reviewed.
