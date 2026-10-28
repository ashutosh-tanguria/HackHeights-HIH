import { createHash } from "crypto";

export type AuditActor = "red" | "blue" | "gateway" | "orchestrator" | "admin" | "anonymous";

export interface AuditEvent {
  index: number;
  id: string;
  timestamp: string;
  evaluationId: string;
  actor: AuditActor;
  action: string;
  targetResource: string;
  canonicalPayload: string;
  payloadSummary: string;
  previousHash: string;
  currentHash: string;
}

export interface VerificationReport {
  isValid: boolean;
  brokenIndex: number | null;
  totalEvents: number;
  checkedAt: string;
  reason?: string;
}

export const GENESIS_PREV_HASH = "0".repeat(64);

export function sha256Hex(data: string): string {
  return createHash("sha256").update(data).digest("hex");
}

/** The exact byte string that is hashed. The offline verifier re-implements this one line. */
export function auditHashInput(e: Omit<AuditEvent, "currentHash">): string {
  return `${e.index}|${e.timestamp}|${e.evaluationId}|${e.actor}|${e.action}|${e.targetResource}|${e.canonicalPayload}|${e.previousHash}`;
}

export function computeAuditNodeHash(e: Omit<AuditEvent, "currentHash">): string {
  return sha256Hex(auditHashInput(e));
}

export function verifyChainIntegrity(chain: AuditEvent[]): VerificationReport {
  const checkedAt = new Date().toISOString();
  for (let i = 0; i < chain.length; i++) {
    const cur = chain[i];
    const expectedPrev = i === 0 ? GENESIS_PREV_HASH : chain[i - 1].currentHash;
    if (cur.index !== i) {
      return { isValid: false, brokenIndex: i, totalEvents: chain.length, checkedAt, reason: `Index gap or reorder at position ${i} (found index ${cur.index}).` };
    }
    if (cur.previousHash !== expectedPrev) {
      return { isValid: false, brokenIndex: i, totalEvents: chain.length, checkedAt, reason: `previousHash of event #${i} does not match the hash of event #${i - 1}.` };
    }
    if (computeAuditNodeHash(cur) !== cur.currentHash) {
      return { isValid: false, brokenIndex: i, totalEvents: chain.length, checkedAt, reason: `Stored hash of event #${i} does not match SHA-256 recomputed from its content.` };
    }
  }
  return { isValid: true, brokenIndex: null, totalEvents: chain.length, checkedAt };
}
