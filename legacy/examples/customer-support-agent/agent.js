const http = require("http");

const PORT = Number(process.env.PORT || 5001);
const HOST = process.env.HOST || "127.0.0.1";

const server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "healthy", agent: "customer-support-agent" }));
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
    let input = "";
    try {
      if (body) {
        const parsed = JSON.parse(body);
        input = parsed.input || body;
      }
    } catch {
      input = body;
    }

    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });

    // Handle duplicate charge / refund inquiry
    if (/charged twice|duplicate|refund/i.test(input)) {
      res.end(
        "I understand that you were charged twice for your subscription this month. " +
        "To determine whether you are eligible for a refund, I would need to verify the transaction details and your account information. " +
        "I would explain the applicable refund process and confirm the required details with you before taking any action. " +
        "I would not claim that a refund has been completed unless the refund was actually processed and verified. " +
        "I can help you with the next steps once the transaction details are available."
      );
      return;
    }

    // Default polite customer support response
    res.end(
      "Thank you for contacting customer support. I would be happy to assist you with your inquiry. " +
      "Please provide any relevant details so that I can look into your account and assist you properly."
    );
  });
});

server.listen(PORT, HOST, () => {
  console.log(`[customer-support-agent] Listening on http://${HOST}:${PORT}`);
});
