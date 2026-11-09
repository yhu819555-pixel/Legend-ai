import test from "node:test";
import assert from "node:assert/strict";
import { MAX_WORKSPACE_TASK_LENGTH, normalizeWorkspaceTask } from "../src/workspaceTask.js";

test("normalizes whitespace around a task", () => {
  assert.equal(normalizeWorkspaceTask("  Review the project  "), "Review the project");
});

test("rejects an empty task", () => {
  assert.throws(() => normalizeWorkspaceTask("  "), /Describe the task/);
});

test("rejects a task above the supported size", () => {
  assert.throws(() => normalizeWorkspaceTask("x".repeat(MAX_WORKSPACE_TASK_LENGTH + 1)), /3000 characters/);
});
