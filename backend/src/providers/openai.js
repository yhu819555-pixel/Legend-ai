export class AIProviderError extends Error {
  constructor(message, status = null) {
    super(message);
    this.name = "AIProviderError";
    this.status = status;
  }
}

export function createOpenAIProvider({
  apiKey = process.env.AI_API_KEY,
  model = process.env.AI_MODEL || "gpt-6.1-sol",
  fetchImpl = fetch
} = {}) {
  return {
    async stream({ input, signal } = {}) {
      if (!apiKey) {
        throw new AIProviderError("AI provider is not configured");
      }
      if (!input || (typeof input !== "string" && !Array.isArray(input))) {
        throw new TypeError("AI input must be a non-empty string or message array");
      }

      const response = await fetchImpl("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          authorization: `Bearer ${apiKey}`,
          "content-type": "application/json",
          accept: "text/event-stream"
        },
        body: JSON.stringify({ model, input, stream: true }),
        signal
      });

      if (!response.ok) {
        throw new AIProviderError(`AI provider request failed (HTTP ${response.status})`, response.status);
      }
      if (!response.body) {
        throw new AIProviderError("AI provider returned an empty stream", response.status);
      }
      return response.body;
    }
  };
}
