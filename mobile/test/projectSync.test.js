import test from "node:test";
import assert from "node:assert/strict";
import { mergeCloudProjectList, mergeProjectSnapshot } from "../src/projectSyncUtils.js";

test("cloud project list merges without replacing local offline projects", async () => {
  const local = [{ id: "local", name: "Offline" }, { id: "same", name: "Local copy" }];
  const cloud = [{ id: "same", name: "Cloud copy" }, { id: "remote", name: "Remote" }];
  assert.deepEqual(await mergeCloudProjectList(local, cloud), [
    { id: "local", name: "Offline" },
    { id: "same", name: "Local copy" },
    { id: "remote", name: "Remote" }
  ]);
});

test("cloud project list keeps local projects when cloud is unavailable", async () => {
  const local = [{ id: "local", name: "Offline" }];
  assert.equal(await mergeCloudProjectList(local, null), local);
});

test("project snapshot merge preserves local-only files and merges remote-only files", () => {
  const result = mergeProjectSnapshot(
    { files: [
      { id: "same", name: "main.js", content: "local newer", updatedAt: "2026-11-07T10:00:00Z" },
      { id: "local", name: "offline.txt", content: "offline", updatedAt: "2026-11-07T09:00:00Z" }
    ], messages: [] },
    { files: [
      { id: "same", name: "main.js", content: "cloud older", updatedAt: "2026-11-07T08:00:00Z" },
      { id: "remote", name: "readme.md", content: "remote", updatedAt: "2026-11-07T09:30:00Z" }
    ], messages: [] }
  );
  assert.deepEqual(result.files.map((file) => file.id), ["local", "remote", "same"]);
  assert.equal(result.files.find((file) => file.id === "same").content, "local newer");
});

test("project snapshot merge keeps local chat and imports missing cloud messages in order", () => {
  const result = mergeProjectSnapshot(
    { files: [], messages: [
      { id: "100", role: "user", content: "local message" },
      { id: "300", role: "assistant", content: "local reply" }
    ] },
    { files: [], messages: [
      { id: "200", role: "user", content: "remote message", createdAt: "2026-11-07T00:00:00Z" },
      { id: "300", role: "assistant", content: "older duplicate", createdAt: "2026-11-07T00:00:01Z" }
    ] }
  );
  assert.deepEqual(result.messages.map((message) => message.id), ["100", "200", "300"]);
  assert.equal(result.messages[2].content, "local reply");
});
