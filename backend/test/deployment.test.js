import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("deployment compose requires private secrets and keeps database internal", async () => {
  const compose = await readFile(new URL("../../docker-compose.yml", import.meta.url), "utf8");
  assert.ok(compose.includes("POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?Set POSTGRES_PASSWORD in your private .env file}"));
  assert.ok(compose.includes("APP_API_TOKEN: ${APP_API_TOKEN:?Set APP_API_TOKEN in your private .env file}"));
  assert.ok(compose.includes("AI_API_KEY: ${AI_API_KEY:?Set AI_API_KEY in your private .env file}"));
  assert.ok(compose.includes("networks: [private]"));
  assert.doesNotMatch(compose, /5432:5432/);
});

test("backend image runs as an unprivileged user and includes migrations", async () => {
  const dockerfile = await readFile(new URL("../Dockerfile", import.meta.url), "utf8");
  assert.ok(dockerfile.includes("USER node"));
  assert.ok(dockerfile.includes("COPY migrations ./migrations"));
});
