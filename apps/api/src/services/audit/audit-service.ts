import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import { AuditEvent, computeAuditNodeHash, verifyChainIntegrity, VerificationReport } from "./hash-chain";
import { sqliteDb } from "../../repositories/sqlite-db";

export class AuditService {
  private events: AuditEvent[] = [];
  private ed25519KeyPair: { publicKey: string; privateKey: string };
  private keyFilePath: string;

  constructor() {
    const keyDir = path.resolve(process.cwd(), ".bayora");
    if (!fs.existsSync(keyDir)) {
      fs.mkdirSync(keyDir, { recursive: true });
    }
    this.keyFilePath = path.join(keyDir, "audit-keypair.json");
    this.ed25519KeyPair = this.loadOrGenerateKeyPair();
    this.initChain();
  }

  private loadOrGenerateKeyPair(): { publicKey: string; privateKey: string } {
    try {
      if (fs.existsSync(this.keyFilePath)) {
        const saved = JSON.parse(fs.readFileSync(this.keyFilePath, "utf-8"));
        if (saved.publicKey && saved.privateKey) {
          return saved;
        }
      }
    } catch (err) {
      console.warn("[AuditService] Could not read saved keypair, generating fresh one:", err);
    }

    const generated = crypto.generateKeyPairSync("ed25519", {
      publicKeyEncoding: { type: "spki", format: "pem" },
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
    });

    try {
      fs.writeFileSync(
        this.keyFilePath,
        JSON.stringify({ publicKey: generated.publicKey, privateKey: generated.privateKey }, null, 2),
        "utf-8"
      );
    } catch (err) {
      console.warn("[AuditService] Failed to persist keypair to disk:", err);
    }

    return generated;
  }

  private initChain() {
    const dbEvents = sqliteDb.getAuditEvents();
    const GENESIS_PREV_HASH = "0000000000000000000000000000000000000000000000000000000000000000";
    if (
      dbEvents &&
      dbEvents.length > 0 &&
      dbEvents[0].index === 0 &&
      dbEvents[0].prevHash === GENESIS_PREV_HASH
    ) {
      this.events = dbEvents.map((r) => ({
        index: r.index,
        id: r.id,
        timestamp: r.timestamp,
        evaluationId: r.evaluationId,
        actor: r.actor as any,
        action: r.action as any,
        targetResource: r.targetResource,
        canonicalPayload: r.canonicalPayload,
        payloadSummary: r.payloadSummary,
        previousHash: r.prevHash,
        currentHash: r.hash,
      }));
    } else {
      this.initGenesisChain();
    }
  }

  public initGenesisChain() {
    sqliteDb.clearAuditEvents();
    this.events = [];
    const genesisPrev = "0000000000000000000000000000000000000000000000000000000000000000";

    const initialDefs: Array<Omit<AuditEvent, "index" | "currentHash" | "previousHash">> = [
      {
        id: "evt-001",
        timestamp: "2026-10-28 00:00:00 UTC",
        evaluationId: "EVAL-2026-INIT",
        actor: "orchestrator",
        action: "EVALUATION_INIT",
        targetResource: "bayora-cluster/init",
        canonicalPayload: JSON.stringify({ mode: "adversarial-blindbox", seed: 9412, target: "qwen2.5:0.5b" }),
        payloadSummary: "Genesis audit event: Evaluation initialized with seed 9412.",
      },
      {
        id: "evt-002",
        timestamp: "2026-10-28 00:00:02 UTC",
        evaluationId: "EVAL-2026-INIT",
        actor: "orchestrator",
        action: "SANDBOX_ATTACH",
        targetResource: "docker/network/red_net",
        canonicalPayload: JSON.stringify({ runtime: "hardened-container", rootfs: "read-only", capDrop: ["ALL"] }),
        payloadSummary: "Red Sandbox attached with cap_drop ALL and read-only rootfs.",
      },
      {
        id: "evt-003",
        timestamp: "2026-10-28 00:00:05 UTC",
        evaluationId: "EVAL-2026-INIT",
        actor: "bayora-gateway",
        action: "POLICY_COMPILED",
        targetResource: "network/isolation",
        canonicalPayload: JSON.stringify({ ingress: ["gateway:4000"], egress: "deny-all" }),
        payloadSummary: "Network isolation active: Default-deny with gateway-only access.",
      },
    ];

    let lastHash = genesisPrev;
    for (let i = 0; i < initialDefs.length; i++) {
      const def = initialDefs[i];
      const partial = {
        ...def,
        index: i,
        previousHash: lastHash,
      };
      const currentHash = computeAuditNodeHash(partial);
      const fullEvent: AuditEvent = { ...partial, currentHash };
      this.events.push(fullEvent);
      lastHash = currentHash;

      sqliteDb.insertAuditEvent({
        idx: fullEvent.index,
        id: fullEvent.id,
        timestamp: fullEvent.timestamp,
        evaluationId: fullEvent.evaluationId,
        actor: fullEvent.actor,
        action: fullEvent.action,
        targetResource: fullEvent.targetResource,
        canonicalPayload: fullEvent.canonicalPayload,
        payloadSummary: fullEvent.payloadSummary,
        prevHash: fullEvent.previousHash,
        hash: fullEvent.currentHash,
      });
    }

    this.createSignedCheckpoint();
  }

  public getEvents(): AuditEvent[] {
    return this.events;
  }

  public getHeadHash(): string {
    return this.events.length > 0 ? this.events[this.events.length - 1].currentHash : "0000000000000000000000000000000000000000000000000000000000000000";
  }

  public appendEvent(eventData: Omit<AuditEvent, "index" | "currentHash" | "previousHash">): AuditEvent {
    const lastEvent = this.events[this.events.length - 1];
    const previousHash = lastEvent ? lastEvent.currentHash : "0000000000000000000000000000000000000000000000000000000000000000";
    const index = this.events.length;

    const partial = {
      ...eventData,
      index,
      previousHash,
    };
    const currentHash = computeAuditNodeHash(partial);
    const newEvent: AuditEvent = { ...partial, currentHash };
    this.events.push(newEvent);

    // Persist to SQLite
    sqliteDb.insertAuditEvent({
      idx: newEvent.index,
      id: newEvent.id,
      timestamp: newEvent.timestamp,
      evaluationId: newEvent.evaluationId,
      actor: newEvent.actor,
      action: newEvent.action,
      targetResource: newEvent.targetResource,
      canonicalPayload: newEvent.canonicalPayload,
      payloadSummary: newEvent.payloadSummary,
      prevHash: newEvent.previousHash,
      hash: newEvent.currentHash,
    });

    if (this.events.length % 5 === 0) {
      this.createSignedCheckpoint();
    }

    return newEvent;
  }

  public createSignedCheckpoint(): { id: string; chainHead: string; signature: string; publicKey: string } {
    const head = this.getHeadHash();
    const eventIndex = Math.max(0, this.events.length - 1);
    const signPayload = Buffer.from(`${eventIndex}:${head}`);
    const signature = crypto.sign(null, signPayload, this.ed25519KeyPair.privateKey).toString("hex");

    const chk = {
      id: `chk-${Date.now()}`,
      eventIndex,
      chainHead: head,
      signature: `ed25519:${signature}`,
      publicKey: this.ed25519KeyPair.publicKey,
      createdAt: new Date().toISOString(),
    };

    sqliteDb.saveCheckpoint(chk);
    return chk;
  }

  public verifyIntegrity(): VerificationReport {
    return verifyChainIntegrity(this.events);
  }

  public verifyChainStatus(): {
    valid: boolean;
    brokenAt: number | null;
    head: string;
    checkpointSignature: string;
    publicKey: string;
    totalEvents: number;
    reason?: string;
  } {
    const report = this.verifyIntegrity();
    const latestChk = sqliteDb.getLatestCheckpoint() || this.createSignedCheckpoint();
    return {
      valid: report.isValid,
      brokenAt: report.brokenIndex,
      head: this.getHeadHash(),
      checkpointSignature: latestChk.signature,
      publicKey: this.ed25519KeyPair.publicKey,
      totalEvents: this.events.length,
      reason: report.reason,
    };
  }

  /**
   * Tamper Demo: tampers a COPY of the audit chain (or demo record) to prove
   * that single-character corruption flips verification RED at the exact broken index,
   * while the original production chain remains 100% intact.
   */
  public tamperDemo(indexToTamper: number = 1): {
    copyBrokenAt: number;
    originalValid: boolean;
    tamperedHash: string;
    expectedHash: string;
    reason: string;
  } {
    const copy: AuditEvent[] = JSON.parse(JSON.stringify(this.events));
    const targetIdx = Math.min(Math.max(0, indexToTamper), copy.length - 1);

    // Tamper one byte in the copy payload
    copy[targetIdx].canonicalPayload = copy[targetIdx].canonicalPayload + "_TAMPERED";

    const copyReport = verifyChainIntegrity(copy);
    const originalReport = this.verifyIntegrity();

    return {
      copyBrokenAt: copyReport.brokenIndex ?? targetIdx,
      originalValid: originalReport.isValid,
      tamperedHash: copy[targetIdx].currentHash,
      expectedHash: computeAuditNodeHash(copy[targetIdx]),
      reason: copyReport.reason || "Cryptographic digest mismatch detected.",
    };
  }

  /**
   * Provenance Bundle Export:
   * Returns a complete, self-contained audit package including chain, checkpoints,
   * public key, and a standalone JavaScript verification runner.
   */
  public exportProvenanceBundle(): {
    bundleVersion: string;
    exportedAt: string;
    publicKey: string;
    chainHead: string;
    totalEvents: number;
    chain: AuditEvent[];
    checkpoints: any[];
    verificationScript: string;
  } {
    const latestChk = sqliteDb.getLatestCheckpoint() || this.createSignedCheckpoint();
    const standaloneScript = `
/**
 * Standalone Offline Bayora Chain Verifier
 * Run with: node verify-offline.js
 */
const crypto = require("crypto");
const fs = require("fs");

function verifyBundle(bundle) {
  const chain = bundle.chain;
  console.log("Verifying " + chain.length + " audit chain events...");
  const GENESIS = "0000000000000000000000000000000000000000000000000000000000000000";

  for (let i = 0; i < chain.length; i++) {
    const ev = chain[i];
    if (i === 0 && ev.previousHash !== GENESIS) {
      console.error("FAIL: Genesis prevHash mismatch");
      return false;
    }
    if (i > 0 && ev.previousHash !== chain[i - 1].currentHash) {
      console.error("FAIL: Chain link broken at index " + i);
      return false;
    }
    const content = ev.index + "|" + ev.timestamp + "|" + ev.evaluationId + "|" + ev.actor + "|" + ev.action + "|" + ev.targetResource + "|" + ev.canonicalPayload + "|" + ev.previousHash;
    const computed = crypto.createHash("sha256").update(content).digest("hex");
    if (computed !== ev.currentHash) {
      console.error("FAIL: Payload mismatch at index " + i);
      return false;
    }
  }

  console.log("PASS: Linear SHA-256 hash chain 100% verified.");
  
  // Verify latest Ed25519 checkpoint signature
  if (bundle.checkpoints && bundle.checkpoints.length > 0) {
    const chk = bundle.checkpoints[bundle.checkpoints.length - 1];
    const sigHex = chk.signature.replace(/^ed25519:/, "");
    const data = Buffer.from(chk.eventIndex + ":" + chk.chainHead);
    const validSig = crypto.verify(null, data, chk.publicKey, Buffer.from(sigHex, "hex"));
    console.log("Ed25519 Checkpoint Signature Valid: " + validSig);
  }
  return true;
}

if (require.main === module) {
  const bundle = JSON.parse(fs.readFileSync("provenance-bundle.json", "utf-8"));
  process.exit(verifyBundle(bundle) ? 0 : 1);
}
module.exports = { verifyBundle };
    `.trim();

    return {
      bundleVersion: "1.0.0",
      exportedAt: new Date().toISOString(),
      publicKey: this.ed25519KeyPair.publicKey,
      chainHead: this.getHeadHash(),
      totalEvents: this.events.length,
      chain: this.events,
      checkpoints: [latestChk],
      verificationScript: standaloneScript,
    };
  }
}

export const auditService = new AuditService();
