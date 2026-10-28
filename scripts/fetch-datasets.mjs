import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { createHash } from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TARGET_PATH = path.resolve(__dirname, "..", "data", "benchmarks", "manifest.json");

function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' && line[i + 1] === '"') {
      current += '"';
      i++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

async function fetchAdvBench(limit = 20) {
  const url = "https://raw.githubusercontent.com/llm-attacks/llm-attacks/main/data/advbench/harmful_behaviors.csv";
  console.log(`[fetch-datasets] Downloading AdvBench from ${url}...`);
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Failed to fetch AdvBench: ${resp.status} ${resp.statusText}`);
  const text = await resp.text();
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  // header: goal,target
  const cases = [];
  const fetchDate = new Date().toISOString();

  for (let i = 1; i < lines.length && cases.length < limit; i++) {
    const cols = parseCSVLine(lines[i]);
    const prompt = cols[0];
    if (!prompt || prompt.length < 10) continue;
    const promptSha256 = createHash("sha256").update(prompt).digest("hex");
    const num = (cases.length + 1).toString().padStart(4, "0");

    cases.push({
      dataset: "AdvBench",
      version: "1.0.0",
      caseId: `AB-${num}`,
      category: "harmful_behaviors",
      sourceUrl: url,
      originalRowId: i,
      prompt,
      promptSha256,
      expected: "refuse",
      license: "MIT (llm-attacks)",
      fetchDate,
    });
  }
  return cases;
}

async function fetchHarmBench(limit = 20) {
  const url = "https://raw.githubusercontent.com/centerforaisafety/HarmBench/main/data/behavior_datasets/harmbench_behaviors_text_all.csv";
  console.log(`[fetch-datasets] Downloading HarmBench from ${url}...`);
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Failed to fetch HarmBench: ${resp.status} ${resp.statusText}`);
  const text = await resp.text();
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  // header: Behavior,FunctionalCategory,SemanticCategory,Tags,ContextString,BehaviorID
  const cases = [];
  const fetchDate = new Date().toISOString();

  for (let i = 1; i < lines.length && cases.length < limit; i++) {
    const cols = parseCSVLine(lines[i]);
    const prompt = cols[0];
    const category = cols[1] || "cyber_boundary";
    const behaviorId = cols[5] || `hb_${i}`;
    if (!prompt || prompt.length < 10) continue;
    const promptSha256 = createHash("sha256").update(prompt).digest("hex");
    const num = (cases.length + 1).toString().padStart(4, "0");

    cases.push({
      dataset: "HarmBench",
      version: "1.0.0",
      caseId: `HB-${num}`,
      category,
      sourceUrl: url,
      originalRowId: behaviorId,
      prompt,
      promptSha256,
      expected: "refuse",
      license: "MIT (Center for AI Safety)",
      fetchDate,
    });
  }
  return cases;
}

async function fetchJailbreakBench(limit = 20) {
  const url = "https://datasets-server.huggingface.co/rows?dataset=rubend18%2FChatGPT-Jailbreak-Prompts&config=default&split=train&offset=0&limit=30";
  console.log(`[fetch-datasets] Downloading JailbreakBench (HF ChatGPT-Jailbreaks) from ${url}...`);
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Failed to fetch Jailbreaks: ${resp.status} ${resp.statusText}`);
  const data = await resp.json();
  const rows = data.rows || [];
  const cases = [];
  const fetchDate = new Date().toISOString();

  for (let i = 0; i < rows.length && cases.length < limit; i++) {
    const row = rows[i].row;
    const prompt = (row.Prompt || row.prompt || row.text || "").trim();
    if (!prompt || prompt.length < 15) continue;
    const promptSha256 = createHash("sha256").update(prompt).digest("hex");
    const num = (cases.length + 1).toString().padStart(4, "0");

    cases.push({
      dataset: "JailbreakBench",
      version: "1.0.0",
      caseId: `JB-${num}`,
      category: "jailbreak_persona",
      sourceUrl: "https://huggingface.co/datasets/rubend18/ChatGPT-Jailbreak-Prompts",
      originalRowId: rows[i].row_idx ?? i,
      prompt,
      promptSha256,
      expected: "refuse",
      license: "Apache-2.0 / Public Domain",
      fetchDate,
    });
  }
  return cases;
}

async function fetchGandalf(limit = 20) {
  const url = "https://datasets-server.huggingface.co/rows?dataset=Lakera%2Fgandalf_ignore_instructions&config=default&split=train&offset=0&limit=30";
  console.log(`[fetch-datasets] Downloading Lakera Gandalf from ${url}...`);
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Failed to fetch Gandalf: ${resp.status} ${resp.statusText}`);
  const data = await resp.json();
  const rows = data.rows || [];
  const cases = [];
  const fetchDate = new Date().toISOString();

  for (let i = 0; i < rows.length && cases.length < limit; i++) {
    const row = rows[i].row;
    const prompt = (row.text || row.prompt || "").trim();
    if (!prompt || prompt.length < 10) continue;
    const promptSha256 = createHash("sha256").update(prompt).digest("hex");
    const num = (cases.length + 1).toString().padStart(4, "0");

    cases.push({
      dataset: "Lakera_Gandalf",
      version: "1.0.0",
      caseId: `GD-${num}`,
      category: "instruction_injection",
      sourceUrl: "https://huggingface.co/datasets/Lakera/gandalf_ignore_instructions",
      originalRowId: rows[i].row_idx ?? i,
      prompt,
      promptSha256,
      expected: "refuse",
      license: "CC-BY-4.0 (Lakera)",
      fetchDate,
    });
  }
  return cases;
}

async function fetchBenign(limit = 20) {
  const url = "https://raw.githubusercontent.com/tatsu-lab/stanford_alpaca/main/alpaca_data.json";
  console.log(`[fetch-datasets] Downloading Benign prompts from ${url}...`);
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Failed to fetch Benign Alpaca: ${resp.status} ${resp.statusText}`);
  const items = await resp.json();
  const cases = [];
  const fetchDate = new Date().toISOString();

  for (let i = 0; i < items.length && cases.length < limit; i++) {
    const item = items[i];
    const prompt = (item.instruction || "").trim();
    if (!prompt || prompt.length < 10) continue;
    const promptSha256 = createHash("sha256").update(prompt).digest("hex");
    const num = (cases.length + 1).toString().padStart(4, "0");

    cases.push({
      dataset: "Benign_Alpaca",
      version: "1.0.0",
      caseId: `BN-${num}`,
      category: "benign_instruction",
      sourceUrl: url,
      originalRowId: i,
      prompt,
      promptSha256,
      expected: "comply",
      license: "CC-BY-NC 4.0 (Stanford Alpaca)",
      fetchDate,
    });
  }
  return cases;
}

async function main() {
  console.log("[fetch-datasets] Starting authoritative dataset fetch...");
  try {
    const [adv, harm, jb, gandalf, benign] = await Promise.all([
      fetchAdvBench(20),
      fetchHarmBench(20),
      fetchJailbreakBench(20),
      fetchGandalf(20),
      fetchBenign(20),
    ]);

    const allCases = [...adv, ...harm, ...jb, ...gandalf, ...benign];
    console.log(`[fetch-datasets] Successfully collected ${allCases.length} total benchmark prompts.`);

    const dir = path.dirname(TARGET_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(TARGET_PATH, JSON.stringify(allCases, null, 2), "utf-8");
    console.log(`[fetch-datasets] Manifest written to ${TARGET_PATH}`);
  } catch (err) {
    console.error(`[fetch-datasets] ERROR: Network error while downloading authoritative datasets.`);
    console.error(err.message);
    if (!fs.existsSync(TARGET_PATH)) {
      process.exit(1);
    } else {
      console.log(`[fetch-datasets] Committed manifest exists; leaving intact.`);
    }
  }
}

main();
