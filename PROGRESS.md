# PROGRESS (Bayora Final, Hack in Hills PS-04)

Legend: [x] built and compiles (`pnpm typecheck` and `pnpm build` were run and pass). Nothing was run end to end by the builder (no Docker, no model, no test suite, no demo), per the brief. The user runs `pnpm verify` and `pnpm demo`.

## Definition of done
- [x] Typecheck + build pass (API, console; tests and demo script also type-checked separately with `tsc -p tests/tsconfig.json`).
- [x] Compose: red_net/blue_net/target_net `internal: true`; gateway the only bridge; cap_drop ALL, no-new-privileges, read_only + tmpfs, non-root, pids/mem/cpu limits on gateway/red/blue/target/web; Dockerfiles for red, blue, gateway, web; Ollama target with `puller` profile for `qwen2.5:0.5b`; red/blue run `runners/sandbox-runner.mjs serve` (no `sleep infinity`).
- [x] Probes: 21 probes via `docker exec`, runner-reported outcomes, positive controls, raw evidence in the audit chain, `UNAVAILABLE` without Docker/containers.
- [x] Evaluation: through the gateway with red tokens (defence = token claim), before/after, n, ASR, relative reduction, Wilson CI, benign false refusal, model+provider, MOCK badge, rows persisted, 502 on provider failure.
- [x] Datasets: `scripts/fetch-datasets.mjs` (re-run during this session: 6 datasets x 20 rows, hashes recomputed by the script), manifest committed.
- [x] Side channel: real streamed TTFT, Red while Blue idle/busy, 3 modes, Mann-Whitney AUC + seeded bootstrap CI from stored samples, `source` badge, simulated for mock.
- [x] Audit: SQLite chain, Ed25519 checkpoints, `/audit/verify`, in-place tamper demo with restore, `/audit/export` + `scripts/verify-bundle.mjs`, logging of probes/evaluations/401/403/429/token issuance.
- [x] Access control: HMAC tokens with capability + resource scope, TTL <= 1h, tenant from token (or enrolment secret), 403 on Red reading defence config, stable HMAC cache salt, rate limit + concurrency cap, live self-test endpoint.
- [x] Observability: anomaly table/feed with fixed-template (payload-free) summaries; tenant telemetry redacted.
- [x] Console: Overview, Isolation probes, Evaluation, Side-channel, Audit, Access control, Threat model; all data from API via server-side proxy; loading + error banners; MOCK/SIMULATED/UNAVAILABLE badges.
- [x] `scripts/demo.ts` (`pnpm demo`) and `pnpm verify`.
- [x] Tests written, not run: 5 files in `tests/`.
- [x] README rewritten honestly.
- [x] Final grep self-audit (output in `../FINAL_REPORT.md`).
- [x] DEMO_SCRIPT.md
- [x] NUMBERS_FOR_PPT.md
- [x] FINAL_REPORT.md (parent folder)

## Decisions / notes
- Inherited agent-reliability product (agents/scenarios/runs UI + API, sql.js store, seeded fake data) moved to `legacy/` (outside the pnpm workspace, not built). Nothing was deleted; Kunal/Pragya folders untouched.
- The three typecheck errors listed in CLAUDE.md (bayora-controller, benchmark-evaluator, isolation-service) disappeared because those files were rewritten; the sql.js store was replaced by `node:sqlite`.
- DB is `node:sqlite` (Node >= 22.5); Docker images use `node:22-alpine`. `sql.js`, `@types/sql.js`, `zod` removed from `apps/api` dependencies and the lockfile refreshed.
- Blue defence logic lives only in the Blue container image (`runners/blue-rules.json`); gateway calls it over blue_net. `BLUE_FILTER_MODE=local` is the dev fallback, reported as `in-process`.
- Defence on/off for an evaluation pass is a claim inside the HMAC-signed token, not a request parameter.
- Red gets only `blockedBy: "defence"` (no stage, no rule ids); Blue/admin tokens see details.
- Salting for Ollama = per-tenant HMAC salt as a system-message prefix (Ollama has no native cache_salt); labelled as such.
- Refusal detection = keyword heuristic, labelled everywhere.
- JailbreakBench is now the real JBB-Behaviors set; the older persona prompts (previously mislabelled JailbreakBench) are a separate dataset "JailbreakPersonas".
- Console has no login and binds to 127.0.0.1; admin key stays server-side in the Next route handler.
- Gateway mounts the Docker socket (needed for `docker exec` probes): documented residual risk T10.
- `infra/` (k8s, gVisor, seccomp) kept as PLANNED reference only (`infra/README.md`).
- Not done on purpose: running Docker, pulling the model, tests, demo. Ollama read-only/non-root settings are untested (fallback in README).
