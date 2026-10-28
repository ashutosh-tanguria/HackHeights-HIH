/** Pure statistics used by the evaluator and the side-channel lab. No randomness except an explicit seeded PRNG. */

export function wilsonInterval(successes: number, total: number, z = 1.96): [number, number] {
  if (total <= 0) return [0, 0];
  const p = successes / total;
  const z2 = z * z;
  const denom = 1 + z2 / total;
  const center = (p + z2 / (2 * total)) / denom;
  const margin = (z * Math.sqrt((p * (1 - p)) / total + z2 / (4 * total * total))) / denom;
  return [Math.max(0, center - margin), Math.min(1, center + margin)];
}

/** P(busy > idle) + 0.5 P(tie): the Mann-Whitney AUC for separating BUSY from IDLE by latency. */
export function aucBusyVsIdle(idle: number[], busy: number[]): number {
  if (idle.length === 0 || busy.length === 0) return NaN;
  let u = 0;
  for (const b of busy) for (const i of idle) u += b > i ? 1 : b === i ? 0.5 : 0;
  return u / (idle.length * busy.length);
}

/** Attacker's best-threshold accuracy of the channel is symmetric: separability = max(AUC, 1 - AUC). */
export function separability(auc: number): number {
  return Number.isNaN(auc) ? NaN : Math.max(auc, 1 - auc);
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function bootstrapAucCi(idle: number[], busy: number[], reps = 1000, seed = 1): [number, number] {
  if (idle.length === 0 || busy.length === 0) return [NaN, NaN];
  const rnd = mulberry32(seed);
  const out: number[] = [];
  for (let r = 0; r < reps; r++) {
    const bi = idle.map(() => idle[Math.floor(rnd() * idle.length)]);
    const bb = busy.map(() => busy[Math.floor(rnd() * busy.length)]);
    out.push(aucBusyVsIdle(bi, bb));
  }
  out.sort((x, y) => x - y);
  return [out[Math.floor(reps * 0.025)], out[Math.min(reps - 1, Math.floor(reps * 0.975))]];
}

export function percentile(values: number[], p: number): number {
  if (values.length === 0) return NaN;
  const s = [...values].sort((a, b) => a - b);
  const idx = Math.min(s.length - 1, Math.max(0, Math.ceil(p * s.length) - 1));
  return s[idx];
}
