import test from "node:test";
import assert from "node:assert/strict";
import {
  createProjectFile, deleteProjectFile, readProjectFiles,
  saveProjectFile, projectFilesKey
} from "../src/projectFiles.js";

function memoryStorage() {
  const values = new Map();
  return {
    async getItem(key) { return values.get(key) ?? null; },
    async setItem(key, value) { values.set(key, value); }
  };
}

test("project files are created and persisted per project", async () => {
  const storage = memoryStorage();
  const file = createProjectFile("main.js", "console.log('ok')", 1000, 0.5);
  const saved = await saveProjectFile(storage, "project-1", file);
  assert.equal(saved.length, 1);
  assert.deepEqual(await readProjectFiles(storage, "project-1"), saved);
  assert.deepEqual(await readProjectFiles(storage, "project-2"), []);
  assert.equal(projectFilesKey("project-1"), "@legend-ai/project-files/project-1");
});

test("project file names cannot contain path traversal or folders", () => {
  assert.throws(() => createProjectFile("../secret.txt", "no"), /simple name/);
  assert.throws(() => createProjectFile("folder/file.js", "no"), /simple name/);
});

test("project files enforce per-file and total size limits", async () => {
  const storage = memoryStorage();
  assert.throws(() => createProjectFile("large.txt", "x".repeat(6001)), /too large/);
  for (let i = 0; i < 10; i++) {
    await saveProjectFile(storage, "p", createProjectFile("f" + i + ".txt", "x".repeat(1000)));
  }
  await assert.rejects(saveProjectFile(storage, "p", createProjectFile("extra.txt", "x")), /at most 10/);
});

test("project files can be updated and deleted", async () => {
  const storage = memoryStorage();
  const first = createProjectFile("notes.md", "old");
  await saveProjectFile(storage, "p", first);
  const updated = await saveProjectFile(storage, "p", { ...first, content: "new" });
  assert.equal(updated[0].content, "new");
  assert.deepEqual(await deleteProjectFile(storage, "p", first.id), []);
});
