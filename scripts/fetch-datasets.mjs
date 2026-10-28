#!/usr/bin/env node
// Downloads small, real subsets of public safety datasets and writes data/benchmarks/manifest.json.
//   pnpm fetch:datasets
// Every row records its source URL, original row id, license note and fetch date. The SHA-256 of each prompt is
// computed HERE, from the downloaded text. Nothing is typed in by hand. If the network fails, the committed
// manifest is left untouched so the demo still works offline.
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const here = path.dirname(fileURLToPath(import.meta.url));
const TARGET_PATH = path.resolve(here, "..", "data", "benchmarks", "manifest.json");
const PER_DATASET = Number(process.env.PER_DATASET ?? 20);
const fetchDate = new Date().toISOString();
const sha = (s) => createHash("sha256").update(s).digest("hex");

/** RFC 4180 style CSV parser (handles quoted fields with commas, quotes and newlines). */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') q = false;
      else cur += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(cur); cur = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cur); cur = "";
      if (row.some((x) => x !== "")) rows.push(row);
      row = [];
    } else cur += c;
  }
  if (cur !== "" || row.length) { row.push(cur); rows.push(row); }
  return rows;
}

async function get(url, json = false) {
  const r = await fetch(url, { signal: AbortSignal.timeout(60000) });
  if (!r.ok) throw new Error(`${url} -> HTTP ${r.status}`);
  return json ? r.json() : r.text();
}

function make({ dataset, prefix, category, sourceUrl, license, expected }, rows) {
  const out = [];
  for (const { prompt, id, cat } of rows) {
    const p = (prompt ?? "").trim();
    if (p.length < 10) continue;
    out.push({
      dataset,
      version: "as-fetched",
      caseId: `${prefix}-${String(out.length + 1).padStart(4, "0")}`,
      category: cat || category,
      sourceUrl,
      originalRowId: id,
      prompt: p,
      promptSha256: sha(p),
      expected,
      license,
      fetchDate,
    });
    if (out.length >= PER_DATASET) break;
  }
  return out;
}

async function advbench() {
  const url = "https://raw.githubusercontent.com/llm-attacks/llm-attacks/main/data/advbench/harmful_behaviors.csv";
  const rows = parseCsv(await get(url)).slice(1).map((c, i) => ({ prompt: c[0], id: i + 1 }));
  return make({ dataset: "AdvBench", prefix: "AB", category: "harmful_behaviors", sourceUrl: url, license: "MIT (llm-attacks)", expected: "refuse" }, rows);
}

async function harmbench() {
  const url = "https://raw.githubusercontent.com/centerforaisafety/HarmBench/main/data/behavior_datasets/harmbench_behaviors_text_all.csv";
  // columns: Behavior,FunctionalCategory,SemanticCategory,Tags,ContextString,BehaviorID
  const rows = parseCsv(await get(url)).slice(1).filter((c) => c[1] === "standard").map((c) => ({ prompt: c[0], id: c[5], cat: c[2] }));
  return make({ dataset: "HarmBench", prefix: "HB", category: "harmbench", sourceUrl: url, license: "MIT (Center for AI Safety)", expected: "refuse" }, rows);
}

async function jailbreakbench() {
  const api = "https://datasets-server.huggingface.co/rows?dataset=JailbreakBench%2FJBB-Behaviors&config=behaviors&split=harmful&offset=0&limit=100";
  const data = await get(api, true);
  const rows = (data.rows ?? []).map((r) => ({ prompt: r.row.Goal, id: r.row.Index, cat: r.row.Category }));
  return make({ dataset: "JailbreakBench", prefix: "JB", category: "jbb_behaviors", sourceUrl: "https://huggingface.co/datasets/JailbreakBench/JBB-Behaviors", license: "MIT (JailbreakBench)", expected: "refuse" }, rows);
}

async function jailbreakPersonas() {
  const api = "https://datasets-server.huggingface.co/rows?dataset=rubend18%2FChatGPT-Jailbreak-Prompts&config=default&split=train&offset=0&limit=100";
  const data = await get(api, true);
  const rows = (data.rows ?? []).map((r) => ({ prompt: r.row.Prompt ?? r.row.prompt ?? r.row.text, id: r.row_idx }));
  return make({ dataset: "JailbreakPersonas", prefix: "JP", category: "jailbreak_persona", sourceUrl: "https://huggingface.co/datasets/rubend18/ChatGPT-Jailbreak-Prompts", license: "not stated on dataset card (check before redistributing)", expected: "refuse" }, rows);
}

async function gandalf() {
  const api = "https://datasets-server.huggingface.co/rows?dataset=Lakera%2Fgandalf_ignore_instructions&config=default&split=train&offset=0&limit=100";
  const data = await get(api, true);
  const rows = (data.rows ?? []).map((r) => ({ prompt: r.row.text, id: r.row_idx }));
  return make({ dataset: "Lakera_Gandalf", prefix: "GD", category: "instruction_injection", sourceUrl: "https://huggingface.co/datasets/Lakera/gandalf_ignore_instructions", license: "MIT (Lakera)", expected: "refuse" }, rows);
}

async function benign() {
  const url = "https://raw.githubusercontent.com/tatsu-lab/stanford_alpaca/main/alpaca_data.json";
  const items = await get(url, true);
  const rows = items.map((it, i) => ({ prompt: it.input ? "" : it.instruction, id: i })); // instruction-only rows: self-contained prompts
  return make({ dataset: "Benign_Alpaca", prefix: "BN", category: "benign_instruction", sourceUrl: url, license: "CC-BY-NC-4.0 (Stanford Alpaca)", expected: "comply" }, rows);
}

try {
  console.log("[fetch-datasets] downloading...");
  const sets = await Promise.all([advbench(), harmbench(), jailbreakbench(), jailbreakPersonas(), gandalf(), benign()]);
  const all = sets.flat();
  for (const s of sets) console.log(`  ${s[0]?.dataset ?? "?"}: ${s.length} rows`);
  fs.mkdirSync(path.dirname(TARGET_PATH), { recursive: true });
  fs.writeFileSync(TARGET_PATH, JSON.stringify(all, null, 2) + "\n", "utf-8");
  console.log(`[fetch-datasets] wrote ${all.length} rows to ${TARGET_PATH}`);
} catch (err) {
  console.error(`[fetch-datasets] FAILED: ${err.message}`);
  console.error(fs.existsSync(TARGET_PATH) ? "[fetch-datasets] keeping the committed manifest (offline mode)." : "[fetch-datasets] no committed manifest exists.");
  process.exit(fs.existsSync(TARGET_PATH) ? 0 : 1);
}
