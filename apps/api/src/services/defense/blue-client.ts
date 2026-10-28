import * as fs from "fs";
import * as path from "path";
import { createHash } from "crypto";
import { env } from "../../config/env";

export interface BlueRule {
  id: string;
  name: string;
  pattern: string;
  flags: string;
}
export interface BlueRules {
  description: string;
  input: BlueRule[];
  output: BlueRule[];
}
export interface BlueVerdict {
  blocked: boolean;
  ruleIds: string[];
  /** "container" = verdict computed inside the Blue container. "in-process" = dev fallback (BLUE_FILTER_MODE=local). */
  execution: "container" | "in-process";
}

export class BlueUnavailableError extends Error {
  public readonly statusCode = 502;
}

export function evaluateRules(rules: BlueRule[], text: string): string[] {
  return rules.filter((r) => new RegExp(r.pattern, r.flags).test(text)).map((r) => r.id);
}

function rulesPath(): string {
  return process.env.BLUE_RULES_PATH ?? path.resolve(__dirname, "../../../../../runners/blue-rules.json");
}

export function loadLocalRules(): { rules: BlueRules; sha256: string } {
  const raw = fs.readFileSync(rulesPath(), "utf-8");
  return { rules: JSON.parse(raw) as BlueRules, sha256: createHash("sha256").update(raw).digest("hex") };
}

/**
 * The gateway's only view of Blue's logic is a verdict. In `remote` mode the rules never exist in the gateway
 * process: they are evaluated inside the Blue container, reachable only over blue_net.
 */
export class BlueClient {
  constructor(private readonly mode = env.BLUE_FILTER_MODE, private readonly url = env.BLUE_FILTER_URL, private readonly fetchImpl: typeof fetch = fetch) {}

  public async filter(direction: "input" | "output", text: string): Promise<BlueVerdict> {
    if (this.mode === "local") {
      const { rules } = loadLocalRules();
      const ruleIds = evaluateRules(direction === "input" ? rules.input : rules.output, text);
      return { blocked: ruleIds.length > 0, ruleIds, execution: "in-process" };
    }
    try {
      const r = await this.fetchImpl(`${this.url}/filter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction, text }),
        signal: AbortSignal.timeout(5000),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = (await r.json()) as { blocked: boolean; ruleIds: string[] };
      return { blocked: !!j.blocked, ruleIds: j.ruleIds ?? [], execution: "container" };
    } catch (e: any) {
      throw new BlueUnavailableError(`Blue defence container unreachable at ${this.url}: ${e?.message ?? e}`);
    }
  }

  /** For defense:read holders only. */
  public async describe(): Promise<{ execution: BlueVerdict["execution"]; rulesSha256: string; rules: BlueRules }> {
    if (this.mode === "local") {
      const l = loadLocalRules();
      return { execution: "in-process", rulesSha256: l.sha256, rules: l.rules };
    }
    try {
      const r = await this.fetchImpl(`${this.url}/rules`, { signal: AbortSignal.timeout(5000) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = (await r.json()) as { rulesSha256: string; rules: BlueRules };
      return { execution: "container", rulesSha256: j.rulesSha256, rules: j.rules };
    } catch (e: any) {
      throw new BlueUnavailableError(`Blue defence container unreachable at ${this.url}: ${e?.message ?? e}`);
    }
  }
}
