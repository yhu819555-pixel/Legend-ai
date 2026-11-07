import test from "node:test";
import assert from "node:assert/strict";
import { AIProviderError, createOpenAIProvider } from "../src/providers/openai.js";

test("provider refuses to run without a server-side API key", async () => {
  let called = false;
  const provider = createOpenAIProvider({ apiKey: "", fetchImpl: async () => { called = true; } });
  await assert.rejects(provider.stream({ input: "hello" }), /not configured/);
  assert.equal(called, false);
});

test("provider requests a real streaming Responses API response", async () => {
  const body = new ReadableStream({ start(controller) { controller.close(); } });
  let request;
  const provider = createOpenAIProvider({
    apiKey: "test-secret",
    model: "gpt-6.1-sol",
    fetchImpl: async (url, options) => {
      request = { url, options };
      return { ok: true, status: 200, body };
    }
  });

  const result = await provider.stream({ input: [{ role: "user", content: "hello" }] });
  assert.equal(result, body);
  assert.equal(request.url, "https://api.openai.com/v1/responses");
  assert.equal(request.options.method, "POST");
  assert.equal(request.options.headers.authorization, "Bearer test-secret");
  assert.equal(request.options.headers.accept, "text/event-stream");
  assert.deepEqual(JSON.parse(request.options.body), {
    model: "gpt-6.1-sol",
    input: [{ role: "user", content: "hello" }],
    stream: true
  });
});

test("provider rejects upstream errors without leaking response details", async () => {
  const provider = createOpenAIProvider({
    apiKey: "test-secret",
    fetchImpl: async () => ({ ok: false, status: 429, text: async () => "private upstream body" })
  });
  await assert.rejects(
    provider.stream({ input: "hello" }),
    (error) => error instanceof AIProviderError &&
      error.status === 429 &&
      !error.message.includes("private upstream body") &&
      !error.message.includes("test-secret")
  );
});

test("provider validates input before making a network request", async () => {
  let called = false;
  const provider = createOpenAIProvider({
    apiKey: "test-secret",
    fetchImpl: async () => { called = true; }
  });
  await assert.rejects(provider.stream({ input: "" }), /non-empty/);
  assert.equal(called, false);
});
