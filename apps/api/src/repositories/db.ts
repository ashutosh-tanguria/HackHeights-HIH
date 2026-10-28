import { DatabaseSync } from "node:sqlite";
import * as fs from "fs";
import * as path from "path";
import { env } from "../config/env";

let _db: DatabaseSync | null = null;

/** Lazily opens the SQLite file (data dir is created on first use). Pass ":memory:" in tests. */
export function getDb(): DatabaseSync {
  if (_db) return _db;
  const file = process.env.BAYORA_DB_PATH ?? path.join(path.resolve(process.cwd(), env.DATA_DIR), "bayora.sqlite");
  if (file !== ":memory:") fs.mkdirSync(path.dirname(file), { recursive: true });
  _db = new DatabaseSync(file);
  _db.exec("PRAGMA journal_mode = WAL;");
  _db.exec(SCHEMA);
  return _db;
}

export function closeDb(): void {
  if (_db) _db.close();
  _db = null;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS audit_events (
  idx INTEGER PRIMARY KEY,
  id TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  evaluation_id TEXT NOT NULL,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  target_resource TEXT NOT NULL,
  canonical_payload TEXT NOT NULL,
  payload_summary TEXT NOT NULL,
  prev_hash TEXT NOT NULL,
  hash TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS checkpoints (
  id TEXT PRIMARY KEY,
  event_index INTEGER NOT NULL,
  chain_head TEXT NOT NULL,
  signature TEXT NOT NULL,
  public_key TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS probe_runs (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  reason TEXT,
  started_at TEXT NOT NULL,
  finished_at TEXT NOT NULL,
  summary TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS probe_results (
  run_id TEXT NOT NULL,
  probe_id TEXT NOT NULL,
  json TEXT NOT NULL,
  PRIMARY KEY (run_id, probe_id)
);
CREATE TABLE IF NOT EXISTS evaluations (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  error TEXT,
  config TEXT NOT NULL,
  summary TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS evaluation_rows (
  evaluation_id TEXT NOT NULL,
  case_id TEXT NOT NULL,
  stage TEXT NOT NULL,
  json TEXT NOT NULL,
  PRIMARY KEY (evaluation_id, case_id, stage)
);
CREATE TABLE IF NOT EXISTS sidechannel_runs (
  id TEXT PRIMARY KEY,
  mode TEXT NOT NULL,
  source TEXT NOT NULL,
  summary TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sidechannel_samples (
  run_id TEXT NOT NULL,
  seq INTEGER NOT NULL,
  blue_state TEXT NOT NULL,
  ttft_ms REAL NOT NULL,
  total_ms REAL NOT NULL,
  PRIMARY KEY (run_id, seq)
);
CREATE TABLE IF NOT EXISTS anomalies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts TEXT NOT NULL,
  kind TEXT NOT NULL,
  severity TEXT NOT NULL,
  tenant TEXT NOT NULL,
  summary TEXT NOT NULL,
  audit_index INTEGER
);
`;
