export function parseSseText(source) {
  let answer = "";
  const blocks = String(source ?? "").replace(/\r\n/g, "\n").split("\n\n");
  for (const block of blocks) {
    const data = block.split("\n")
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trimStart())
      .join("\n");
    if (!data || data === "[DONE]") continue;
    let event;
    try { event = JSON.parse(data); } catch { continue; }
    if (typeof event.delta === "string") answer += event.delta;
    if (event.type === "error" || event.error) {
      const message = event.error?.message || event.message || "The AI response was interrupted.";
      throw new Error(message);
    }
  }
  return answer.trim();
}

export async function sendChatMessage({ baseUrl, token, messages, fetchImpl = fetch }) {
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
    body: JSON.stringify({ messages })
  });
  if (!response.ok) {
    let code = "AI service request failed (" + response.status + ").";
    try {
      const payload = await response.json();
      if (payload.error === "unauthorized") code = "Backend token galat hai.";
      else if (payload.error === "auth_not_configured") code = "Backend par APP_API_TOKEN set nahi hai.";
      else if (payload.error === "rate_limited") code = "AI service busy hai. Thodi der baad try karo.";
      else if (payload.error === "ai_provider_unavailable") code = "AI provider abhi available nahi hai. Server key check karo.";
    } catch {}
    throw new Error(code);
  }
  const answer = parseSseText(await response.text());
  if (!answer) throw new Error("AI se khaali response mila. Backend provider settings check karo.");
  return answer;
}
