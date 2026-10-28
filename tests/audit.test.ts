import "./_env";
import { describe, it } from "node:test";
import assert from "node:assert";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { spawnSync } from "child_process";
import { auditService } from "../apps/api/src/services/audit/audit-service";
import { verifyChainIntegrity } from "../apps/api/src/services/audit/hash-chain";

function seed(n = 6) {
  const a = auditService();
  for (let i = 0; i < n; i++) a.append({ evaluationId: "t", actor: "admin", action: "TEST", targetResource: "test", payload: { i }, summary: `event ${i}` });
  return a;
}

describe("audit chain", () => {
  it("starts with a genesis event and verifies", () => {
    const a = seed();
    const v = a.verify();
    assert.ok(v.isValid, v.reason);
    assert.strictEqual(a.getEvents()[0].action, "CHAIN_GENESIS");
    assert.ok(v.checkpoints.length >= 1 && v.checkpointsValid);
  });

  it("tamper demo breaks verification at exactly the mutated index, then restores", () => {
    const a = seed();
    const r = a.tamperDemo(3);
    assert.strictEqual(r.status, "EXECUTED");
    if (r.status !== "EXECUTED") return;
    assert.strictEqual(r.tamperedIndex, 3);
    assert.strictEqual(r.before.valid, true);
    assert.strictEqual(r.during.valid, false);
    assert.strictEqual(r.during.brokenIndex, 3);
    assert.strictEqual(r.after.valid, true);
    assert.strictEqual(r.restored, true);
    assert.ok(a.verify().isValid);
  });

  it("verifyChainIntegrity pinpoints a modified link and a reordered chain", () => {
    const chain = seed().getEvents().map((e) => ({ ...e }));
    const mutated = chain.map((e) => ({ ...e }));
    mutated[2].canonicalPayload = "{}";
    assert.strictEqual(verifyChainIntegrity(mutated).brokenIndex, 2);
    const swapped = [chain[0], chain[2], chain[1], ...chain.slice(3)];
    assert.strictEqual(verifyChainIntegrity(swapped).isValid, false);
  });

  it("the exported bundle verifies offline with scripts/verify-bundle.mjs, and a doctored bundle fails", () => {
    const bundle = seed().exportBundle();
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "bayora-bundle-"));
    const good = path.join(dir, "good.json");
    const bad = path.join(dir, "bad.json");
    fs.writeFileSync(good, JSON.stringify(bundle));
    const doctored = JSON.parse(JSON.stringify(bundle));
    doctored.chain[2].canonicalPayload += "x";
    fs.writeFileSync(bad, JSON.stringify(doctored));
    const script = path.resolve(__dirname, "../scripts/verify-bundle.mjs");
    assert.strictEqual(spawnSync(process.execPath, [script, good]).status, 0);
    const r = spawnSync(process.execPath, [script, bad], { encoding: "utf-8" });
    assert.strictEqual(r.status, 1);
    assert.match(r.stderr, /index 2/);
  });
});
