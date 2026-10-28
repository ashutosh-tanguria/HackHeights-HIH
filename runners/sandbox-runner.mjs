// Bayora sandbox runner. Runs INSIDE the red and blue containers (ROLE=red|blue), plain Node, no dependencies.
//   serve                      long-running process (health endpoint; Blue also serves /filter and /rules)
//   probe <id> [--k v ...]     one boundary probe; prints exactly one JSON line {"outcome","detail"}
//   attack [--n 5]             Red only: enrol, fetch payloads through the gateway, send them, print a summary
// The host orchestrator launches probes with `docker exec`. Outcomes: DENIED | REACHED | ERROR.
import net from "node:net";
import dns from "node:dns/promises";
import fs from "node:fs";
import http from "node:http";
import crypto from "node:crypto";

const ROLE = process.env.ROLE;
const GATEWAY = process.env.GATEWAY_URL ?? "http://gateway:4000";
const ENROLL_SECRET = process.env.BAYORA_ENROLL_SECRET ?? "";

const out = (outcome, detail, extra = {}) => {
  console.log(JSON.stringify({ role: ROLE, outcome, detail, ...extra }));
  process.exit(0);
};

function parseArgs(argv) {
  const o = {};
  for (let i = 0; i < argv.length; i += 2) o[argv[i].replace(/^--/, "")] = argv[i + 1];
  return o;
}

/** TCP connect. ECONNREFUSED still proves a route to the peer exists, so it counts as reachable. */
function tcp(host, port, timeoutMs = 2500) {
  return new Promise((resolve) => {
    const s = net.connect({ host, port: Number(port) });
    const done = (r) => {
      s.destroy();
      resolve(r);
    };
    s.setTimeout(timeoutMs, () => done({ reachable: false, why: "timeout" }));
    s.on("connect", () => done({ reachable: true, why: "connected" }));
    s.on("error", (e) => done({ reachable: e.code === "ECONNREFUSED", why: e.code ?? e.message }));
  });
}

async function enroll() {
  const r = await fetch(`${GATEWAY}/api/v1/enroll`, { method: "POST", headers: { "x-bayora-enroll-secret": ENROLL_SECRET, "content-type": "application/json" }, body: "{}", signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error(`enroll HTTP ${r.status}`);
  return (await r.json()).token;
}

async function probe(id, a) {
  const attempts = [];
  switch (true) {
    case id.endsWith("-to-blue") || id.endsWith("-to-red") || id.endsWith("-to-target"): {
      const targets = [a.host, ...(a.ips && a.ips !== "-" ? a.ips.split(",") : [])];
      for (const t of targets) {
        const r = await tcp(t, a.port);
        attempts.push(`${t}:${a.port}=${r.why}`);
        if (r.reachable) return out("REACHED", `connected/route exists: ${attempts.join("; ")}`);
      }
      return out("DENIED", `no route: ${attempts.join("; ")}${a.ips === "-" ? " (no peer IP was supplied, name lookup only)" : ""}`);
    }
    case id.includes("-dns-"): {
      for (const n of a.names.split(",")) {
        try {
          const r = await dns.lookup(n);
          return out("REACHED", `${n} resolved to ${r.address}`);
        } catch (e) {
          attempts.push(`${n}=${e.code}`);
        }
      }
      return out("DENIED", `no name resolved: ${attempts.join("; ")}`);
    }
    case id.endsWith("-egress"): {
      for (const t of a.targets.split(",")) {
        const [h, p] = t.split(":");
        const r = await tcp(h, p);
        attempts.push(`${t}=${r.why}`);
        if (r.reachable) return out("REACHED", `internet reachable: ${attempts.join("; ")}`);
      }
      return out("DENIED", `no egress: ${attempts.join("; ")}`);
    }
    case id.includes("docker-socket"): {
      try {
        fs.statSync(a.path);
        return out("REACHED", `${a.path} exists`);
      } catch (e) {
        return out("DENIED", `${a.path}: ${e.code}`);
      }
    }
    case id.includes("-reads-"): {
      try {
        const b = fs.readFileSync(a.path);
        return out("REACHED", `read ${b.length} bytes from ${a.path}`);
      } catch (e) {
        return out("DENIED", `${a.path}: ${e.code}`);
      }
    }
    case id.endsWith("-rootfs-write"): {
      try {
        fs.writeFileSync(a.path, "x");
        fs.unlinkSync(a.path);
        return out("REACHED", `wrote to ${a.path}`);
      } catch (e) {
        return out("DENIED", `${a.path}: ${e.code}`);
      }
    }
    case id.endsWith("-privileges"): {
      const st = fs.readFileSync("/proc/self/status", "utf-8");
      const g = (k) => (st.match(new RegExp(`^${k}:\\s*(.+)$`, "m")) ?? [])[1]?.trim() ?? "?";
      const capEff = g("CapEff");
      const noNew = g("NoNewPrivs");
      const uid = g("Uid").split(/\s+/)[0];
      const bad = !/^0+$/.test(capEff) || noNew !== "1" || uid === "0";
      return out(bad ? "REACHED" : "DENIED", `CapEff=${capEff} NoNewPrivs=${noNew} uid=${uid}`);
    }
    case id === "red-defense-config": {
      const token = await enroll();
      const r = await fetch(`${GATEWAY}/api/v1/defense/config`, { headers: { authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(8000) });
      if (r.status === 403) return out("DENIED", "gateway answered HTTP 403 to Red's token");
      if (r.status === 200) return out("REACHED", "gateway returned Blue's config to Red (HTTP 200)");
      return out("ERROR", `unexpected HTTP ${r.status}`);
    }
    case id.endsWith("-gateway-control"): {
      const token = await enroll();
      const r = await fetch(`${GATEWAY}/api/v1/whoami`, { headers: { authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(8000) });
      const j = await r.json().catch(() => ({}));
      if (r.status === 200 && j.tenant === ROLE) return out("REACHED", `gateway accepted ${ROLE} token (tenant=${j.tenant})`);
      return out("ERROR", `HTTP ${r.status} tenant=${j.tenant}`);
    }
    case id.endsWith("-inference-control"): {
      const token = await enroll();
      const r = await fetch(`${GATEWAY}/v1/chat/completions`, { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify({ prompt: "Reply with the single word OK.", max_tokens: 8 }), signal: AbortSignal.timeout(120000) });
      const j = await r.json().catch(() => ({}));
      if (r.status === 200) return out("REACHED", `completion via gateway: provider=${j.bayora?.provider} model=${j.bayora?.model} mock=${j.bayora?.isMock} ttftMs=${Math.round(j.bayora?.ttftMs ?? -1)}`);
      return out("ERROR", `gateway HTTP ${r.status}: ${j.error?.message ?? ""}`.slice(0, 300));
    }
    default:
      return out("ERROR", `unknown probe '${id}'`);
  }
}

async function attack(n) {
  const token = await enroll();
  const pr = await fetch(`${GATEWAY}/api/v1/payloads`, { headers: { authorization: `Bearer ${token}` } });
  const corpus = (await pr.json()).cases.filter((c) => c.expected === "refuse").slice(0, n);
  const rows = [];
  for (const c of corpus) {
    const r = await fetch(`${GATEWAY}/v1/chat/completions`, { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify({ prompt: c.prompt, max_tokens: 64 }), signal: AbortSignal.timeout(120000) });
    const j = await r.json().catch(() => ({}));
    rows.push({ caseId: c.caseId, http: r.status, blockedBy: j.bayora?.blockedBy ?? null, refused: j.bayora?.refused ?? null, mock: j.bayora?.isMock ?? null });
  }
  console.log(JSON.stringify({ role: "red", sent: rows.length, rows }, null, 2));
}

function serve() {
  const routes = {};
  if (ROLE === "red") {
    fs.mkdirSync("/payloads", { recursive: true });
    fs.writeFileSync("/payloads/corpus.txt", `red-private-corpus marker ${crypto.randomBytes(8).toString("hex")}\n`);
  }
  if (ROLE === "blue") {
    fs.mkdirSync("/secrets", { recursive: true });
    fs.writeFileSync("/secrets/defense.key", `blue-private-key marker ${crypto.randomBytes(16).toString("hex")}\n`);
    const raw = fs.readFileSync("/app/blue-rules.json", "utf-8");
    const rules = JSON.parse(raw);
    const sha = crypto.createHash("sha256").update(raw).digest("hex");
    const run = (list, text) => list.filter((r) => new RegExp(r.pattern, r.flags).test(text)).map((r) => r.id);
    routes["POST /filter"] = (body, res) => {
      const { direction, text } = JSON.parse(body || "{}");
      const ruleIds = run(direction === "output" ? rules.output : rules.input, String(text ?? ""));
      res.end(JSON.stringify({ blocked: ruleIds.length > 0, ruleIds }));
    };
    routes["GET /rules"] = (_b, res) => res.end(JSON.stringify({ rulesSha256: sha, rules }));
  }
  routes["GET /health"] = (_b, res) => res.end(JSON.stringify({ role: ROLE, status: "ok" }));
  const port = ROLE === "red" ? 8080 : 8081;
  http
    .createServer((req, res) => {
      let body = "";
      req.on("data", (c) => (body += c));
      req.on("end", () => {
        res.setHeader("content-type", "application/json");
        const h = routes[`${req.method} ${req.url}`];
        if (!h) {
          res.statusCode = 404;
          return res.end("{}");
        }
        try {
          h(body, res);
        } catch (e) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: String(e.message) }));
        }
      });
    })
    .listen(port, "0.0.0.0", () => console.log(`[${ROLE}-runner] listening on ${port}`));
}

const [cmd, ...rest] = process.argv.slice(2);
if (cmd === "serve") serve();
else if (cmd === "probe") probe(rest[0], parseArgs(rest.slice(1))).catch((e) => out("ERROR", String(e?.message ?? e)));
else if (cmd === "attack") attack(Number(parseArgs(rest).n ?? 3)).catch((e) => console.error(JSON.stringify({ error: String(e?.message ?? e) })));
else {
  console.error("usage: serve | probe <id> [--k v] | attack [--n 3]");
  process.exit(2);
}
