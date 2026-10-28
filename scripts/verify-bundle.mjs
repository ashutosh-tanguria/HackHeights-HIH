#!/usr/bin/env node
// Offline verifier for a Bayora audit export. No dependency on the API or the database.
//   node scripts/verify-bundle.mjs bundle.json
// Exit code 0 = chain and all checkpoints verify, 1 = failure (first broken index is printed).
import { createHash, verify } from "node:crypto";
import { readFileSync } from "node:fs";

const GENESIS = "0".repeat(64);
const file = process.argv[2];
if (!file) {
  console.error("usage: node scripts/verify-bundle.mjs <bundle.json>");
  process.exit(2);
}
const bundle = JSON.parse(readFileSync(file, "utf-8"));
const chain = bundle.chain ?? [];

function hashOf(e) {
  const s = `${e.index}|${e.timestamp}|${e.evaluationId}|${e.actor}|${e.action}|${e.targetResource}|${e.canonicalPayload}|${e.previousHash}`;
  return createHash("sha256").update(s).digest("hex");
}

let ok = true;
for (let i = 0; i < chain.length; i++) {
  const e = chain[i];
  const prev = i === 0 ? GENESIS : chain[i - 1].currentHash;
  if (e.index !== i || e.previousHash !== prev || hashOf(e) !== e.currentHash) {
    console.error(`FAIL: chain breaks at index ${i}`);
    ok = false;
    break;
  }
}
if (ok) console.log(`PASS: ${chain.length} events, hash chain intact, head ${chain.at(-1)?.currentHash ?? GENESIS}`);

let sigOk = 0;
for (const c of bundle.checkpoints ?? []) {
  const valid = verify(null, Buffer.from(`${c.eventIndex}:${c.chainHead}`), c.publicKey, Buffer.from(c.signature.replace(/^ed25519:/, ""), "hex"));
  const matches = chain[c.eventIndex]?.currentHash === c.chainHead;
  if (!valid || !matches) {
    console.error(`FAIL: checkpoint ${c.id} (event ${c.eventIndex}) signatureValid=${valid} matchesChain=${matches}`);
    ok = false;
  } else sigOk++;
}
console.log(`${sigOk}/${(bundle.checkpoints ?? []).length} Ed25519 checkpoints verified`);
process.exit(ok ? 0 : 1);
