import test from "node:test";
import assert from "node:assert/strict";
import { createBackup, restoreBackup } from "../src/backup.js";
import { STORAGE_KEY } from "../src/projectStore.js";

function memoryStorage() {
  const values = new Map();
  return {
    async getItem(key) { return values.get(key) ?? null; },
    async setItem(key, value) { values.set(key, value); }
  };
}

test("backup exports projects, files and chat history without settings or tokens", async () => {
  const storage = memoryStorage();
  await storage.setItem(STORAGE_KEY, JSON.stringify([{ id: "p1", name: "Demo", createdAt: "2026-01-01" }]));
  await storage.setItem("@legend-ai/project-files/p1", JSON.stringify([{ id: "f1", name: "main.js", content: "ok" }]));
  await storage.setItem("@legend-ai/chat/p1", JSON.stringify([{ id: "m1", role: "user", content: "hello" }]));
  const backup = await createBackup(storage, "2026-11-07T00:00:00.000Z");
  assert.equal(backup.format, "legend-ai-backup");
  assert.equal(backup.projects[0].files[0].name, "main.js");
  assert.equal(backup.projects[0].messages[0].content, "hello");
  assert.equal(JSON.stringify(backup).includes("backend_token"), false);
});

test("backup restore merges projects and restores files and chat", async () => {
  const storage = memoryStorage();
  await storage.setItem(STORAGE_KEY, JSON.stringify([{ id: "old", name: "Keep", createdAt: "2026-01-01" }]));
  const result = await restoreBackup(storage, {
    format: "legend-ai-backup", version: 1, projects: [{
      id: "p1", name: "Restored", createdAt: "2026-01-02",
      files: [{ id: "f1", name: "a.txt", content: "data" }],
      messages: [{ id: "m1", role: "assistant", content: "answer" }]
    }]
  });
  assert.equal(result.restoredCount, 1);
  assert.equal(result.projects.length, 2);
  assert.equal((await storage.getItem("@legend-ai/project-files/p1")).includes("a.txt"), true);
  assert.equal((await storage.getItem("@legend-ai/chat/p1")).includes("answer"), true);
});

test("backup restore rejects unsafe paths and unsupported formats", async () => {
  const storage = memoryStorage();
  await assert.rejects(restoreBackup(storage, { format: "other", version: 1, projects: [] }), /not supported/);
  await assert.rejects(restoreBackup(storage, {
    format: "legend-ai-backup", version: 1, projects: [{
      id: "p1", name: "Demo", createdAt: "2026-01-01",
      files: [{ id: "f1", name: "../secret", content: "x" }], messages: []
    }]
  }), /invalid project files/);
});
