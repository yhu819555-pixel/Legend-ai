import test from "node:test";
import assert from "node:assert/strict";
import { createProjectStore } from "../src/database.js";

function fakePool() {
  const calls = [];
  return {
    calls,
    async query(sql, params = []) {
      calls.push({ sql, params });
      if (sql.includes("SELECT id, name, created_at") && sql.includes("WHERE id")) {
        return { rows: [{ id: params[0], name: "demo", createdAt: "2026-01-01", updatedAt: "2026-01-01" }] };
      }
      if (sql.includes("SELECT id FROM projects WHERE")) return { rows: [{ id: params[0] }], rowCount: 1 };
      if (sql.includes("DELETE FROM projects")) return { rows: [{ id: params[0] }], rowCount: 1 };
      return { rows: [], rowCount: 1 };
    },
    async connect() {
      return {
        async query(sql, params = []) {
          calls.push({ sql, params });
          if (sql.includes("SELECT id FROM projects WHERE")) return { rows: [{ id: params[0] }], rowCount: 1 };
          if (sql.includes("SELECT id, name, created_at") && sql.includes("WHERE id")) return { rows: [{ id: params[0], name: "demo", createdAt: "2026-01-01", updatedAt: "2026-01-01" }] };
          return { rows: [], rowCount: 1 };
        },
        release() { calls.push({ sql: "RELEASE" }); }
      };
    },
    async end() {}
  };
}

test("project store lists and creates project records with parameterized queries", async () => {
  const pool = fakePool();
  const store = createProjectStore(pool);
  await store.listProjects();
  await store.createProject({ id: "p1", name: "Demo" });
  assert.match(pool.calls[0].sql, /ORDER BY updated_at DESC/);
  assert.deepEqual(pool.calls[1].params, ["p1", "Demo"]);
  assert.ok(pool.calls.every((call) => !call.sql.includes("Demo")));
});

test("project deletion uses a parameterized ID and reports whether it existed", async () => {
  const pool = fakePool();
  const store = createProjectStore(pool);
  assert.equal(await store.deleteProject("p1"), true);
  assert.deepEqual(pool.calls[0].params, ["p1"]);
});

test("project updates use a transaction and always release the connection", async () => {
  const pool = fakePool();
  const store = createProjectStore(pool);
  const result = await store.updateProject("p1", { name: "Renamed", files: [], messages: [] });
  assert.equal(result.id, "p1");
  assert.ok(pool.calls.some((call) => call.sql === "BEGIN"));
  assert.ok(pool.calls.some((call) => call.sql === "COMMIT"));
  assert.ok(pool.calls.some((call) => call.sql === "RELEASE"));
});
