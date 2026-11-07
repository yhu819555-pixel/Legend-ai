import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("deployment compose requires private secrets and keeps database internal", async () => {
  const compose = await readFile(new URL("../../docker-compose.yml", import.meta.url), "utf8");
  assert.match(compose, /POSTGRES_PASSWORD:\\?\\$\\{POSTGRES_PASSWORD:\\?Set POSTGRES_PASSWORD/);
  assert.match(compose, /APP_API_TOKEN:\\?\\$\\{APP_API_TOKEN:\\?Set APP_API_TOKEN/);
  assert.match(compose, /AI_API_KEY:\\?\\$\\{AI_API_KEY:\\?Set AI_API_KEY/);
  assert.match(compose, /networks: \\[private\\]/);
  assert.doesNotMatch(compose, /5432:5432/);
});

test("backend image runs as an unprivileged user", async () => {
  const dockerfile = await readFile(new URL("../Dockerfile", import.meta.url), "utf8");
  assert.match(dockerfile, /USER node/);
  assert.match(dockerfile, /COPY migrations \.\\/migrations/);
});
