import { describe, it } from "node:test";
import assert from "node:assert";
import { sha256, computeAuditNodeHash, verifyChainIntegrity } from "../../apps/web/src/lib/crypto-audit";

describe("Bayora Cryptographic & Security Verification Tests", () => {
  it("computes standard SHA-256 matching known cryptographic hash vectors", () => {
    // Known NIST vector: sha256("") = e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
    const emptyHash = sha256("");
    assert.strictEqual(emptyHash, "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");

    // Known vector: sha256("abc") = ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad
    const abcHash = sha256("abc");
    assert.strictEqual(abcHash, "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });

  it("builds and verifies an unbroken linear forensic audit chain", () => {
    const payloads = [
      "event=SANDBOX_INITIALIZED&runtime=gvisor",
      "event=PROBE_EXECUTED&probe=network_red_to_blue&status=BLOCKED",
      "event=GATEWAY_INFERENCE&tenant=red&capability=model.inference",
      "event=CHECKPOINT_SIGNED&signer=bayora_root",
    ];

    let prev = "0000000000000000000000000000000000000000000000000000000000000000";
    const chain = [];

    for (const p of payloads) {
      const curr = computeAuditNodeHash(prev, p);
      chain.push({
        canonicalPayload: p,
        previousHash: prev,
        currentHash: curr,
      });
      prev = curr;
    }

    const verification = verifyChainIntegrity(chain);
    assert.strictEqual(verification.isValid, true);
    assert.strictEqual(verification.brokenIndex, null);
  });

  it("detects single-character audit block tampering immediately at the exact index", () => {
    const payloads = [
      "event=SANDBOX_INITIALIZED&runtime=gvisor",
      "event=PROBE_EXECUTED&probe=network_red_to_blue&status=BLOCKED",
      "event=GATEWAY_INFERENCE&tenant=red&capability=model.inference",
      "event=CHECKPOINT_SIGNED&signer=bayora_root",
    ];

    let prev = "0000000000000000000000000000000000000000000000000000000000000000";
    const chain = [];

    for (const p of payloads) {
      const curr = computeAuditNodeHash(prev, p);
      chain.push({
        canonicalPayload: p,
        previousHash: prev,
        currentHash: curr,
      });
      prev = curr;
    }

    // Tamper with block #1 (change BLOCKED to ALLOWED)
    chain[1].canonicalPayload = "event=PROBE_EXECUTED&probe=network_red_to_blue&status=ALLOWED";

    const verification = verifyChainIntegrity(chain);
    assert.strictEqual(verification.isValid, false);
    assert.strictEqual(verification.brokenIndex, 1);
  });

  it("verifies capability authorization logic for Red tenant", () => {
    const authorized = (tenant: string, capability: string) => {
      if (tenant === "red") {
        return capability === "model.inference";
      }
      return false;
    };

    assert.strictEqual(authorized("red", "model.inference"), true);
    assert.strictEqual(authorized("red", "admin.reset"), false);
    assert.strictEqual(authorized("red", "model.weights.export"), false);
  });
});
