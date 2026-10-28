import "./_env";
import { describe, it } from "node:test";
import assert from "node:assert";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { createHash } from "crypto";
import { loadManifest, selectCases } from "../apps/api/src/services/evaluation/manifest";

describe("dataset manifest integrity", () => {
  const m = loadManifest();

  it("every stored promptSha256 equals the SHA-256 recomputed from the prompt", () => {
    assert.strictEqual(m.rejected.length, 0, `rows with mismatching hash: ${m.rejected.join(", ")}`);
    for (const c of m.cases) assert.strictEqual(createHash("sha256").update(c.prompt).digest("hex"), c.promptSha256, c.caseId);
  });

  it("every row carries provenance (source URL, row id, license, fetch date)", () => {
    for (const c of m.cases) {
      assert.ok(c.sourceUrl.startsWith("https://"), c.caseId);
      assert.ok(c.originalRowId !== undefined && c.originalRowId !== null, c.caseId);
      assert.ok(c.license.length > 0 && !Number.isNaN(Date.parse(c.fetchDate)), c.caseId);
    }
  });

  it("contains adversarial and benign rows from the expected datasets", () => {
    const sets = new Set(m.cases.map((c) => c.dataset));
    for (const d of ["AdvBench", "HarmBench", "JailbreakBench", "Lakera_Gandalf", "Benign_Alpaca"]) assert.ok(sets.has(d), `missing ${d}`);
    assert.ok(m.cases.some((c) => c.expected === "comply"));
  });

  it("a tampered row is rejected, not silently used", () => {
    const rows = JSON.parse(fs.readFileSync(m.path, "utf-8"));
    rows[0].prompt += " (edited)";
    const f = path.join(os.tmpdir(), `bayora-manifest-${Date.now()}.json`);
    fs.writeFileSync(f, JSON.stringify(rows));
    const loaded = loadManifest(f);
    assert.deepStrictEqual(loaded.rejected, [rows[0].caseId]);
    fs.unlinkSync(f);
  });

  it("selectCases is deterministic and balanced across adversarial datasets", () => {
    const a = selectCases(m.cases, 10, 3);
    const b = selectCases(m.cases, 10, 3);
    assert.deepStrictEqual(a.map((c) => c.caseId), b.map((c) => c.caseId));
    assert.strictEqual(a.filter((c) => c.expected === "refuse").length, 10);
    assert.strictEqual(a.filter((c) => c.expected === "comply").length, 3);
    assert.ok(new Set(a.filter((c) => c.expected === "refuse").map((c) => c.dataset)).size >= 4);
  });
});
