import test from "node:test";
import assert from "node:assert/strict";
import { createAndSaveProject } from "../src/projectActions.js";
import { STORAGE_KEY } from "../src/projectStore.js";

function memoryStorage(initial = null) {
  let value = initial;
  return {
    async getItem(key) { assert.equal(key, STORAGE_KEY); return value; },
    async setItem(key, next) { assert.equal(key, STORAGE_KEY); value = next; },
    value: () => value
  };
}

test("createAndSaveProject creates and persists a project", async () => {
  const storage = memoryStorage();
  const result = await createAndSaveProject(storage, [], "  Demo  ");
  assert.equal(result.project.name, "Demo");
  assert.deepEqual(result.projects, [result.project]);
  assert.deepEqual(JSON.parse(storage.value()), [result.project]);
});

test("createAndSaveProject rejects empty names without writing storage", async () => {
  const storage = memoryStorage();
  await assert.rejects(createAndSaveProject(storage, [], "  "), /Project name is required/);
  assert.equal(storage.value(), null);
});

test("createAndSaveProject propagates storage failures", async () => {
  const storage = { async setItem() { throw new Error("disk unavailable"); } };
  await assert.rejects(createAndSaveProject(storage, [], "Demo"), /disk unavailable/);
});
