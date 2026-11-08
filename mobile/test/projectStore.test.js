import test from "node:test";
import assert from "node:assert/strict";
import { createProject, readProjects, saveProject, deleteProject, STORAGE_KEY } from "../src/projectStore.js";

function memoryStorage(initial = null) {
  let value = initial;
  return {
    async getItem(key) { assert.equal(key, STORAGE_KEY); return value; },
    async setItem(key, next) { assert.equal(key, STORAGE_KEY); value = next; },
    value: () => value
  };
}

test("createProject trims names and creates stable metadata", () => {
  const project = createProject("  Demo app  ", 1_700_000_000_000, 0.5);
  assert.equal(project.name, "Demo app");
  assert.equal(project.createdAt, "2023-11-14T22:13:20.000Z");
  assert.match(project.id, /^1700000000000-/);
});

test("createProject rejects an empty name", () => {
  assert.throws(() => createProject("  "), /Project name is required/);
});

test("readProjects returns an empty list for a new install", async () => {
  assert.deepEqual(await readProjects(memoryStorage()), []);
});

test("saveProject persists data that can be read after reopening", async () => {
  const storage = memoryStorage();
  const project = createProject("Persistent project", 1_700_000_000_000, 0.25);
  const updated = await saveProject(storage, [], project);
  assert.deepEqual(updated, [project]);
  assert.deepEqual(await readProjects(storage), [project]);
});

test("readProjects rejects corrupt or incompatible stored data", async () => {
  await assert.rejects(readProjects(memoryStorage("{bad json")), SyntaxError);
  await assert.rejects(readProjects(memoryStorage(JSON.stringify({ name: "not a list" }))), /invalid format/);
});

test("deleteProject removes local metadata, files and chat history", async () => {
  const values = new Map([
    [STORAGE_KEY, JSON.stringify([{ id: "p1", name: "Demo", createdAt: "2026-01-01" }, { id: "p2", name: "Keep", createdAt: "2026-01-02" }])],
    ["@legend-ai/project-files/p1", "[]"],
    ["@legend-ai/chat/p1", "[]"]
  ]);
  const storage = {
    async getItem(key) { return values.get(key) ?? null; },
    async setItem(key, value) { values.set(key, value); },
    async removeItem(key) { values.delete(key); }
  };
  const next = await deleteProject(storage, JSON.parse(values.get(STORAGE_KEY)), "p1");
  assert.deepEqual(next.map((item) => item.id), ["p2"]);
  assert.equal(values.has("@legend-ai/project-files/p1"), false);
  assert.equal(values.has("@legend-ai/chat/p1"), false);
});
