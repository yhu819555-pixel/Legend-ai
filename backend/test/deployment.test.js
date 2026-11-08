import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("production compose requires private secrets and exposes only HTTPS proxy", async () => {
  const compose = await readFile(new URL("../../docker-compose.yml", import.meta.url), "utf8");
  assert.ok(compose.includes("POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?Set POSTGRES_PASSWORD in your private .env file}"));
  assert.ok(compose.includes("APP_API_TOKEN: ${APP_API_TOKEN:?Set APP_API_TOKEN in your private .env file}"));
  assert.ok(compose.includes("AI_API_KEY: ${AI_API_KEY:?Set AI_API_KEY in your private .env file}"));
  assert.ok(compose.includes("DOMAIN: ${DOMAIN:?Set DOMAIN to a DNS name pointing at this server}"));
  assert.ok(compose.includes('expose:\n      - "8080"'));
  assert.ok(compose.includes('"443:443"'));
  assert.doesNotMatch(compose, /"8080:8080"/);
  assert.doesNotMatch(compose, /5432:5432/);
  const caddy = await readFile(new URL("../../Caddyfile", import.meta.url), "utf8");
  assert.ok(caddy.includes("reverse_proxy backend:8080"));
});

test("backend image runs as an unprivileged user and includes migrations", async () => {
  const dockerfile = await readFile(new URL("../Dockerfile", import.meta.url), "utf8");
  assert.ok(dockerfile.includes("USER node"));
  assert.ok(dockerfile.includes("COPY migrations ./migrations"));
});
