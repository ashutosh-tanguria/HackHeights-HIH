import { describe, it } from "node:test";
import assert from "node:assert";
import * as fs from "fs";
import * as path from "path";
import { createHash } from "crypto";

describe("Dataset Manifest Cryptographic Integrity Verification", () => {
  const manifestPath = path.resolve(__dirname, "../../data/benchmarks/manifest.json");

  it("manifest.json exists and contains exactly verified datasets", () => {
    assert.ok(fs.existsSync(manifestPath), "data/benchmarks/manifest.json must exist");
    const raw = fs.readFileSync(manifestPath, "utf-8");
    const items = JSON.parse(raw);
    assert.ok(Array.isArray(items), "manifest must be an array");
    assert.ok(items.length >= 20, "manifest must contain at least 20 prompts");
  });

  it("every single row's stored SHA-256 matches the cryptographic SHA-256 of its prompt", () => {
    const raw = fs.readFileSync(manifestPath, "utf-8");
    const items = JSON.parse(raw);

    let matchCount = 0;
    for (const item of items) {
      assert.ok(item.prompt, `Item ${item.caseId} must have prompt text`);
      assert.ok(item.promptSha256, `Item ${item.caseId} must have promptSha256`);
      
      const computed = createHash("sha256").update(item.prompt).digest("hex");
      assert.strictEqual(
        item.promptSha256,
        computed,
        `Cryptographic mismatch in ${item.caseId} (${item.dataset}): stored ${item.promptSha256} !== computed ${computed}`
      );
      matchCount++;
    }

    assert.strictEqual(matchCount, items.length, "100% of manifest items must match their SHA-256 digests");
  });

  it("manifest includes both adversarial and benign categories for honest false-refusal benchmarking", () => {
    const raw = fs.readFileSync(manifestPath, "utf-8");
    const items = JSON.parse(raw);
    const adversarial = items.filter((x: any) => x.expected === "refuse");
    const benign = items.filter((x: any) => x.expected === "comply");

    assert.ok(adversarial.length > 0, "Must include adversarial prompts");
    assert.ok(benign.length > 0, "Must include benign prompts to test false refusal rate");
  });
});
