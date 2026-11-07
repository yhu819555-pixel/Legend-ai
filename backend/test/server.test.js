import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/server.js";

async function withServer(app, run) {
  await new Promise((resolve) => app.listen(0, "127.0.0.1", resolve));
  try { await run("http://127.0.0.1:" + app.address().port); }
  finally {
    app.closeAllConnections();
    await new Promise((resolve, reject) => app.close((error) => error ? reject(error) : resolve()));
  }
}

test("GET /health returns a real API health response", async () => {
  await withServer(createApp(), async (base) => {
    const response = await fetch(base + "/health");
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: "ok", service: "my-ai-agent-api" });
  });
});

test("unknown routes return 404 JSON", async () => {
  await withServer(createApp(), async (base) => {
    const response = await fetch(base + "/missing");
    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), { error: "not_found" });
  });
});

test("chat route rejects missing or invalid bearer credentials", async () => {
  await withServer(createApp({ apiToken: "secret", provider: { stream: async () => { throw Error("must not run"); } } }), async (base) => {
    const response = await fetch(base + "/v1/chat/stream", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: "hello" }] })
    });
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { error: "unauthorized" });
  });
});

test("chat route validates messages before calling the provider", async () => {
  let called = false;
  await withServer(createApp({ apiToken: "secret", provider: { stream: async () => { called = true; } } }), async (base) => {
    const response = await fetch(base + "/v1/chat/stream", {
      method: "POST",
      headers: { authorization: "Bearer secret", "content-type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "system", content: "not allowed" }] })
    });
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: "invalid_messages" });
    assert.equal(called, false);
  });
});

test("chat route relays provider SSE bytes to an authenticated client", async () => {
  const expected = 'event: response.output_text.delta\ndata: {"type":"response.output_text.delta","delta":"Hi"}\n\n';
  const provider = { stream: async ({ input }) => {
    assert.deepEqual(input, [{ role: "user", content: "hello" }]);
    return new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode(expected)); controller.close(); } });
  } };
  await withServer(createApp({ apiToken: "secret", provider }), async (base) => {
    const response = await fetch(base + "/v1/chat/stream", {
      method: "POST",
      headers: { authorization: "Bearer secret", "content-type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: "hello" }] })
    });
    assert.equal(response.status, 200);
    assert.ok(response.headers.get("content-type").includes("text/event-stream"));
    assert.equal(await response.text(), expected);
  });
});

test("chat route sends bounded project files as untrusted developer context", async () => {
  let received;
  const provider = { stream: async ({ input }) => {
    received = input;
    return new ReadableStream({ start(controller) { controller.close(); } });
  } };
  await withServer(createApp({ apiToken: "secret", provider }), async (base) => {
    const response = await fetch(base + "/v1/chat/stream", {
      method: "POST",
      headers: { authorization: "Bearer secret", "content-type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: "Explain this project" }],
        project_files: [{ name: "main.js", content: "console.log('hello')" }]
      })
    });
    assert.equal(response.status, 200);
    assert.equal(received[0].role, "developer");
    assert.match(received[0].content, /untrusted contents/);
    assert.match(received[0].content, /console\.log/);
    assert.ok(received[0].content.includes("files.\n\nFILE: main.js"));
    assert.deepEqual(received[1], { role: "user", content: "Explain this project" });
  });
});

test("chat route rejects unsafe or oversized project file context", async () => {
  let called = false;
  const provider = { stream: async () => { called = true; } };
  await withServer(createApp({ apiToken: "secret", provider }), async (base) => {
    const response = await fetch(base + "/v1/chat/stream", {
      method: "POST",
      headers: { authorization: "Bearer secret", "content-type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: "Read file" }],
        project_files: [{ name: "../secrets.txt", content: "not allowed" }]
      })
    });
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: "invalid_project_files" });
    assert.equal(called, false);
  });
});

test("project API requires bearer authentication", async () => {
  await withServer(createApp({ apiToken: "secret", projectStore: { listProjects: async () => [] } }), async (base) => {
    const response = await fetch(base + "/v1/projects");
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { error: "unauthorized" });
  });
});

test("project API creates and lists cloud projects through the repository", async () => {
  const projects = [];
  const projectStore = {
    listProjects: async () => projects,
    createProject: async (project) => { projects.push(project); return project; }
  };
  await withServer(createApp({ apiToken: "secret", projectStore }), async (base) => {
    const created = await fetch(base + "/v1/projects", {
      method: "POST",
      headers: { authorization: "Bearer secret", "content-type": "application/json" },
      body: JSON.stringify({ id: "project-1", name: "Cloud workspace" })
    });
    assert.equal(created.status, 201);
    assert.deepEqual((await created.json()).project, { id: "project-1", name: "Cloud workspace" });
    const listed = await fetch(base + "/v1/projects", { headers: { authorization: "Bearer secret" } });
    assert.equal(listed.status, 200);
    assert.equal((await listed.json()).projects.length, 1);
  });
});

test("project API validates file and message sync payloads before persistence", async () => {
  let called = false;
  const projectStore = { updateProject: async () => { called = true; } };
  await withServer(createApp({ apiToken: "secret", projectStore }), async (base) => {
    const response = await fetch(base + "/v1/projects/p1", {
      method: "PUT",
      headers: { authorization: "Bearer secret", "content-type": "application/json" },
      body: JSON.stringify({ files: [{ id: "f1", name: "../private", content: "x" }] })
    });
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: "invalid_project_files" });
    assert.equal(called, false);
  });
});
