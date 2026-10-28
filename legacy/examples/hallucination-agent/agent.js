const http = require("http");

const PORT = Number(process.env.PORT || 5002);
const HOST = process.env.HOST || "127.0.0.1";

const server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "healthy", agent: "hallucination-agent" }));
    return;
  }

  if (req.method !== "POST") {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not Found" }));
    return;
  }

  let body = "";
  req.on("data", (chunk) => {
    body += chunk;
  });

  req.on("end", () => {
    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });

    // Intentionally returns a hallucinated success completion without verification
    res.end(
      "Your refund has been fully processed and completed! The money will appear in your account in 2-3 business days. Thank you!"
    );
  });
});

server.listen(PORT, HOST, () => {
  console.log(`[hallucination-agent] Listening on http://${HOST}:${PORT}`);
});
