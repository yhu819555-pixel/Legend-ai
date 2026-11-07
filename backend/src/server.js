import { createServer } from "node:http";
import { pathToFileURL } from "node:url";

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

// Start the listener only when this file is executed directly, never when imported by tests.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  createApp().listen(port, "0.0.0.0", () => {
    console.log(`API listening on port ${port}`);
  });
}
