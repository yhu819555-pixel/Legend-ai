function parseEventBlock(block, state, onDelta) {
  const data = block.split("\n")
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trimStart())
    .join("\n");
  if (!data || data === "[DONE]") return;
  let event;
  try { event = JSON.parse(data); } catch { return; }
  if (typeof event.delta === "string") {
    state.answer += event.delta;
    if (onDelta) onDelta(event.delta);
  }
  if (event.type === "error" || event.type === "response.failed" || event.error) {
    const message = event.error?.message || event.response?.error?.message || event.message || "The AI response was interrupted.";
    throw new Error(message);
  }
}

export function parseSseText(source) {
  const state = { answer: "" };
  const blocks = String(source ?? "").replace(/\r\n/g, "\n").split("\n\n");
  for (const block of blocks) parseEventBlock(block, state);
  return state.answer.trim();
}

async function readSseResponse(response, onDelta) {
  const body = response.body;
  if (!body || typeof body.getReader !== "function" || typeof TextDecoder === "undefined") {
    const answer = parseSseText(await response.text());
    if (answer && onDelta) onDelta(answer);
    return answer;
  }
  const reader = body.getReader();
  const decoder = new TextDecoder();
  const state = { answer: "" };
  let buffer = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      buffer += decoder.decode(value || new Uint8Array(), { stream: !done }).replace(/\r\n/g, "\n");
      const blocks = buffer.split("\n\n");
      buffer = blocks.pop() || "";
      for (const block of blocks) parseEventBlock(block, state, onDelta);
      if (done) break;
    }
    if (buffer.trim()) parseEventBlock(buffer, state, onDelta);
  } finally {
    reader.releaseLock();
  }
  return state.answer.trim();
}

export async function sendChatMessage({ baseUrl, token, messages, projectFiles = [], onDelta, fetchImpl = fetch }) {
  const cleanUrl = String(baseUrl ?? "").trim().replace(/\/+$/, "");
  if (!/^https?:\/\/[^/]+/i.test(cleanUrl)) throw new Error("Settings mein valid backend URL dalo.");
  if (!String(token ?? "").trim()) throw new Error("Settings mein backend access token dalo.");
  const response = await fetchImpl(cleanUrl + "/v1/chat/stream", {
    method: "POST",
    headers: {
      authorization: "Bearer " + token.trim(),
      "content-type": "application/json",
      accept: "text/event-stream"
    },
    body: JSON.stringify({
      messages,
      project_files: projectFiles.map(({ name, content }) => ({ name, content }))
    })
  });
  if (!response.ok) {
    let code = "AI service request failed (" + response.status + ").";
    try {
      const payload = await response.json();
      if (payload.error === "unauthorized") code = "Backend token galat hai.";
      else if (payload.error === "auth_not_configured") code = "Backend par APP_API_TOKEN set nahi hai.";
      else if (payload.error === "rate_limited") code = "AI service busy hai. Thodi der baad try karo.";
      else if (payload.error === "ai_provider_unavailable") code = "AI provider abhi available nahi hai. Server key check karo.";
      else if (payload.error === "invalid_project_files") code = "Project files ka format ya size limit galat hai.";
    } catch {}
    throw new Error(code);
  }
  const answer = await readSseResponse(response, onDelta);
  if (!answer) throw new Error("AI se khaali response mila. Backend provider settings check karo.");
  return answer;
}
