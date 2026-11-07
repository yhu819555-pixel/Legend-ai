import test from "node:test";
import assert from "node:assert/strict";
import { mergeCloudProjectList } from "../src/projectSync.js";

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
