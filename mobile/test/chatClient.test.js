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

test("sendChatMessage sends bearer auth and returns the parsed answer", async () => {
  let request;
  const answer = await sendChatMessage({
    baseUrl: "https://api.example.test/",
    token: "secret",
    messages: [{ role: "user", content: "hi" }],
    fetchImpl: async (url, options) => {
      request = { url, options };
      return { ok: true, text: async () => 'data: {"type":"response.output_text.delta","delta":"Hello"}\n\n' };
    }
  });
  assert.equal(answer, "Hello");
  assert.equal(request.url, "https://api.example.test/v1/chat/stream");
  assert.equal(request.options.headers.authorization, "Bearer secret");
});

test("sendChatMessage rejects a missing token before network access", async () => {
  await assert.rejects(() => sendChatMessage({
    baseUrl: "https://api.example.test", token: "", messages: [],
    fetchImpl: async () => { throw new Error("network should not run"); }
  }), /access token/);
});
