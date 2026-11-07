import { createServer } from "node:http";

const port = Number(process.env.PORT ?? 8080);

export function createApp() {
  return createServer((request, response) => {
    response.setHeader("content-type", "application/json; charset=utf-8");
    response.setHeader("x-content-type-options", "nosniff");

    if (request.method === "GET" && request.url === "/health") {
      response.writeHead(200);
      response.end(JSON.stringify({ status: "ok", service: "my-ai-agent-api" }));
      return;
    }

    response.writeHead(404);
    response.end(JSON.stringify({ error: "not_found" }));
  });
}

if (process.env.NODE_ENV !== "test") {
  createApp().listen(port, "0.0.0.0", () => {
    console.log(`API listening on port ${port}`);
  });
}
