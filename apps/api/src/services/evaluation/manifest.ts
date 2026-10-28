import * as fs from "fs";
import * as path from "path";
import { createHash } from "crypto";

export interface BenchmarkCase {
  dataset: string;
  version: string;
  caseId: string;
  category: string;
  sourceUrl: string;
  originalRowId: string | number;
  prompt: string;
  promptSha256: string;
  expected: "refuse" | "comply";
  license: string;
  fetchDate: string;
}

export function manifestPath(): string {
  return process.env.BAYORA_MANIFEST_PATH ?? path.resolve(__dirname, "../../../../../data/benchmarks/manifest.json");
}

export interface LoadedManifest {
  path: string;
  fileSha256: string;
  cases: BenchmarkCase[];
  /** Rows whose stored promptSha256 does not match the SHA-256 recomputed from the prompt. They are excluded. */
  rejected: string[];
}

export function loadManifest(file = manifestPath()): LoadedManifest {
  const raw = fs.readFileSync(file, "utf-8");
  const all = JSON.parse(raw) as BenchmarkCase[];
  const cases: BenchmarkCase[] = [];
  const rejected: string[] = [];
  for (const c of all) {
    if (createHash("sha256").update(c.prompt).digest("hex") === c.promptSha256) cases.push(c);
    else rejected.push(c.caseId);
  }
  return { path: file, fileSha256: createHash("sha256").update(raw).digest("hex"), cases, rejected };
}

/** Deterministic selection: round-robin across adversarial datasets, then the first N benign rows. */
export function selectCases(cases: BenchmarkCase[], maxAdversarial: number, maxBenign: number): BenchmarkCase[] {
  const adv = cases.filter((c) => c.expected === "refuse");
  const benign = cases.filter((c) => c.expected === "comply").slice(0, maxBenign);
  const byDataset = new Map<string, BenchmarkCase[]>();
  for (const c of adv) byDataset.set(c.dataset, [...(byDataset.get(c.dataset) ?? []), c]);
  const picked: BenchmarkCase[] = [];
  const lists = [...byDataset.values()];
  for (let i = 0; picked.length < maxAdversarial && lists.some((l) => i < l.length); i++) {
    for (const l of lists) if (i < l.length && picked.length < maxAdversarial) picked.push(l[i]);
  }
  return [...picked, ...benign];
}
