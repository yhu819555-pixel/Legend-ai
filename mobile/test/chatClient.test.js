import test from "node:test";
import assert from "node:assert/strict";
import { parseSseText, sendChatMessage } from "../src/chatClient.js";

test("parseSseText joins streamed output text deltas", () => {
  const source = 'event: response.output_text.delta\ndata: {"type":"response.output_text.delta","delta":"Hello"}\n\n' +
    'event: response.output_text.delta\ndata: {"type":"response.output_text.delta","delta":" world"}\n\n';
  assert.equal(parseSseText(source), "Hello world");
});

test("parseSseText reports provider stream errors", () => {
  assert.throws(() => parseSseText('data: {"type":"error","message":"provider failed"}\n\n'), /provider failed/);
});

test("sendChatMessage sends bearer auth and project file context", async () => {
  let request;
  const answer = await sendChatMessage({
    baseUrl: "https://api.example.test/",
    token: "secret",
    messages: [{ role: "user", content: "hi" }],
    projectFiles: [{ name: "main.js", content: "console.log('hi')" }],
    fetchImpl: async (url, options) => {
      request = { url, options };
      return { ok: true, text: async () => 'data: {"type":"response.output_text.delta","delta":"Hello"}\n\n' };
    }
  });
  assert.equal(answer, "Hello");
  assert.equal(request.url, "https://api.example.test/v1/chat/stream");
  assert.equal(request.options.headers.authorization, "Bearer secret");
  assert.deepEqual(JSON.parse(request.options.body).project_files, [{ name: "main.js", content: "console.log('hi')" }]);
});

test("sendChatMessage reports each incremental SSE delta", async () => {
  const deltas = [];
  const chunks = [
    'data: {"type":"response.output_text.delta","delta":"Hel',
    'lo"}\n\n'
  ];
  const stream = new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(new TextEncoder().encode(chunk));
      controller.close();
    }
  });
  const answer = await sendChatMessage({
    baseUrl: "https://api.example.test",
    token: "secret",
    messages: [{ role: "user", content: "hi" }],
    onDelta: (delta) => deltas.push(delta),
    fetchImpl: async () => ({ ok: true, body: stream })
  });
  assert.equal(answer, "Hello");
  assert.deepEqual(deltas, ["Hello"]);
});

test("sendChatMessage rejects a missing token before network access", async () => {
  await assert.rejects(() => sendChatMessage({
    baseUrl: "https://api.example.test", token: "", messages: [],
    fetchImpl: async () => { throw new Error("network should not run"); }
  }), /access token/);
});
