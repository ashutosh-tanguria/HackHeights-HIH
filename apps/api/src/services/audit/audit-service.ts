import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import { env } from "../../config/env";
import { getDb } from "../../repositories/db";
import {
  AuditActor,
  AuditEvent,
  GENESIS_PREV_HASH,
  VerificationReport,
  computeAuditNodeHash,
  verifyChainIntegrity,
} from "./hash-chain";

export interface Checkpoint {
  id: string;
  eventIndex: number;
  chainHead: string;
  signature: string; // "ed25519:<hex>"
  publicKey: string; // SPKI PEM
  createdAt: string;
}

export interface NewAuditEvent {
  evaluationId: string;
  actor: AuditActor;
  action: string;
  targetResource: string;
  /** Object is JSON-stringified. Never put raw Red payloads or Blue rules in here: store hashes. */
  payload: unknown;
  summary: string;
}

const CHECKPOINT_EVERY = 10;

function loadKeyPair(): { publicKey: string; privateKey: string } {
  const dir = path.resolve(process.cwd(), env.DATA_DIR);
  const file = path.join(dir, "audit-keypair.json");
  try {
    const saved = JSON.parse(fs.readFileSync(file, "utf-8"));
    if (saved.publicKey && saved.privateKey) return saved;
  } catch {
    /* generate below */
  }
  const kp = crypto.generateKeyPairSync("ed25519", {
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });
  if (process.env.BAYORA_DB_PATH !== ":memory:") {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(file, JSON.stringify(kp, null, 2), { mode: 0o600 });
  }
  return kp;
}

type Row = Record<string, any>;

function rowToEvent(r: Row): AuditEvent {
  return {
    index: Number(r.idx),
    id: r.id,
    timestamp: r.timestamp,
    evaluationId: r.evaluation_id,
    actor: r.actor,
    action: r.action,
    targetResource: r.target_resource,
    canonicalPayload: r.canonical_payload,
    payloadSummary: r.payload_summary,
    previousHash: r.prev_hash,
    currentHash: r.hash,
  };
}

export class AuditService {
  private keys = loadKeyPair();

  /** Always reads from SQLite so the verifier sees what is actually stored. */
  public getEvents(): AuditEvent[] {
    return (getDb().prepare("SELECT * FROM audit_events ORDER BY idx ASC").all() as Row[]).map(rowToEvent);
  }

  public count(): number {
    return Number((getDb().prepare("SELECT COUNT(*) AS c FROM audit_events").get() as Row).c);
  }

  public getHeadHash(): string {
    const r = getDb().prepare("SELECT hash FROM audit_events ORDER BY idx DESC LIMIT 1").get() as Row | undefined;
    return r ? r.hash : GENESIS_PREV_HASH;
  }

  public append(e: NewAuditEvent): AuditEvent {
    const db = getDb();
    const last = db.prepare("SELECT idx, hash FROM audit_events ORDER BY idx DESC LIMIT 1").get() as Row | undefined;
    const index = last ? Number(last.idx) + 1 : 0;
    const partial = {
      index,
      id: `evt-${index}-${crypto.randomBytes(4).toString("hex")}`,
      timestamp: new Date().toISOString(),
      evaluationId: e.evaluationId,
      actor: e.actor,
      action: e.action,
      targetResource: e.targetResource,
      canonicalPayload: typeof e.payload === "string" ? e.payload : JSON.stringify(e.payload),
      payloadSummary: e.summary,
      previousHash: last ? (last.hash as string) : GENESIS_PREV_HASH,
    };
    const ev: AuditEvent = { ...partial, currentHash: computeAuditNodeHash(partial) };
    db.prepare(
      `INSERT INTO audit_events (idx,id,timestamp,evaluation_id,actor,action,target_resource,canonical_payload,payload_summary,prev_hash,hash)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    ).run(ev.index, ev.id, ev.timestamp, ev.evaluationId, ev.actor, ev.action, ev.targetResource, ev.canonicalPayload, ev.payloadSummary, ev.previousHash, ev.currentHash);
    if ((index + 1) % CHECKPOINT_EVERY === 0) this.createCheckpoint();
    return ev;
  }

  /** Records the chain start once, with the real time it happened. */
  public ensureGenesis(): void {
    if (this.count() === 0) {
      this.append({
        evaluationId: "SYSTEM",
        actor: "orchestrator",
        action: "CHAIN_GENESIS",
        targetResource: "audit/chain",
        payload: { note: "audit chain created", publicKeyFingerprint: this.publicKeyFingerprint() },
        summary: "Audit chain created.",
      });
      this.createCheckpoint();
    }
  }

  public publicKeyFingerprint(): string {
    return crypto.createHash("sha256").update(this.keys.publicKey).digest("hex").slice(0, 16);
  }

  public createCheckpoint(): Checkpoint {
    const eventIndex = Math.max(0, this.count() - 1);
    const chainHead = this.getHeadHash();
    const sig = crypto.sign(null, Buffer.from(`${eventIndex}:${chainHead}`), this.keys.privateKey).toString("hex");
    const chk: Checkpoint = {
      id: `chk-${eventIndex}-${crypto.randomBytes(3).toString("hex")}`,
      eventIndex,
      chainHead,
      signature: `ed25519:${sig}`,
      publicKey: this.keys.publicKey,
      createdAt: new Date().toISOString(),
    };
    getDb()
      .prepare("INSERT INTO checkpoints (id,event_index,chain_head,signature,public_key,created_at) VALUES (?,?,?,?,?,?)")
      .run(chk.id, chk.eventIndex, chk.chainHead, chk.signature, chk.publicKey, chk.createdAt);
    return chk;
  }

  public getCheckpoints(): Checkpoint[] {
    return (getDb().prepare("SELECT * FROM checkpoints ORDER BY event_index ASC, created_at ASC").all() as Row[]).map((r) => ({
      id: r.id,
      eventIndex: Number(r.event_index),
      chainHead: r.chain_head,
      signature: r.signature,
      publicKey: r.public_key,
      createdAt: r.created_at,
    }));
  }

  /** Checks every stored checkpoint: Ed25519 signature AND that it still matches the chain. */
  public verifyCheckpoints(chain: AuditEvent[], checkpoints: Checkpoint[]) {
    return checkpoints.map((c) => {
      let signatureValid = false;
      try {
        signatureValid = crypto.verify(null, Buffer.from(`${c.eventIndex}:${c.chainHead}`), c.publicKey, Buffer.from(c.signature.replace(/^ed25519:/, ""), "hex"));
      } catch {
        signatureValid = false;
      }
      const ev = chain[c.eventIndex];
      const matchesChain = !!ev && ev.currentHash === c.chainHead;
      return { id: c.id, eventIndex: c.eventIndex, signatureValid, matchesChain };
    });
  }

  public verify(): VerificationReport & { checkpoints: ReturnType<AuditService["verifyCheckpoints"]>; head: string; publicKeyFingerprint: string; checkpointsValid: boolean } {
    const chain = this.getEvents();
    const report = verifyChainIntegrity(chain);
    const checkpoints = this.verifyCheckpoints(chain, this.getCheckpoints());
    const checkpointsValid = checkpoints.every((c) => c.signatureValid && c.matchesChain);
    return {
      ...report,
      isValid: report.isValid && checkpointsValid,
      reason: report.reason ?? (checkpointsValid ? undefined : "A signed checkpoint no longer matches the chain."),
      checkpoints,
      checkpointsValid,
      head: this.getHeadHash(),
      publicKeyFingerprint: this.publicKeyFingerprint(),
    };
  }

  /**
   * Real tamper demo: edits one stored row in SQLite, verifies (expect FAIL at that index),
   * restores the original bytes, verifies again (expect PASS). Runs synchronously so no
   * other request can append or verify while the row is altered.
   */
  public tamperDemo(requestedIndex?: number) {
    const db = getDb();
    const n = this.count();
    if (n < 2) {
      return { status: "UNAVAILABLE" as const, reason: "Need at least 2 audit events to demonstrate tampering." };
    }
    const index = Math.min(Math.max(1, requestedIndex ?? Math.floor(n / 2)), n - 1);
    const orig = db.prepare("SELECT canonical_payload FROM audit_events WHERE idx = ?").get(index) as Row;
    const before = this.verify();
    db.prepare("UPDATE audit_events SET canonical_payload = ? WHERE idx = ?").run(orig.canonical_payload + " ", index);
    let during;
    try {
      during = this.verify();
    } finally {
      db.prepare("UPDATE audit_events SET canonical_payload = ? WHERE idx = ?").run(orig.canonical_payload, index);
    }
    const after = this.verify();
    return {
      status: "EXECUTED" as const,
      tamperedIndex: index,
      mutation: "appended one space character to canonical_payload of the stored row",
      before: { valid: before.isValid, brokenIndex: before.brokenIndex },
      during: { valid: during.isValid, brokenIndex: during.brokenIndex, reason: during.reason },
      after: { valid: after.isValid, brokenIndex: after.brokenIndex },
      restored: after.isValid,
    };
  }

  public exportBundle() {
    const chain = this.getEvents();
    const checkpoints = this.getCheckpoints();
    return {
      bundleVersion: 1,
      exportedAt: new Date().toISOString(),
      hashInput: "index|timestamp|evaluationId|actor|action|targetResource|canonicalPayload|previousHash",
      publicKey: this.keys.publicKey,
      chainHead: this.getHeadHash(),
      totalEvents: chain.length,
      chain,
      checkpoints,
      verifyWith: "node scripts/verify-bundle.mjs <bundle.json>",
    };
  }
}

let _audit: AuditService | null = null;
export function auditService(): AuditService {
  if (!_audit) {
    _audit = new AuditService();
    _audit.ensureGenesis();
  }
  return _audit;
}
export function resetAuditServiceForTests(): void {
  _audit = null;
}
