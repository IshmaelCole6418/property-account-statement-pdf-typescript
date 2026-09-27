import { createServer } from "node:http";
import { exportStatement, InfraiError } from "./statement_service.js";

const server = createServer(async (request, response) => {
  if (request.method !== "POST" || request.url !== "/statements/export") {
    response.writeHead(404, { "content-type": "application/json" });
    response.end(JSON.stringify({ error: "Not found" }));
    return;
  }
  try {
    const chunks: Buffer[] = [];
    for await (const chunk of request) chunks.push(Buffer.from(chunk));
    const result = await exportStatement(JSON.parse(Buffer.concat(chunks).toString("utf8")));
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify(result));
  } catch (error) {
    const status = error instanceof InfraiError ? Math.min(Math.max(error.status, 400), 499) : 400;
    response.writeHead(status, { "content-type": "application/json" });
    response.end(JSON.stringify({ error: error instanceof Error ? error.message : "Invalid request" }));
  }
});

server.listen(Number(process.env.PORT ?? 3000), () => {
  console.log("statement service listening on http://localhost:" + (process.env.PORT ?? 3000));
});
