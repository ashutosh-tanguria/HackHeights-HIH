# Numbers for the slides

**Every value below is a placeholder. Fill after the user runs `pnpm demo`.** Copy values from the demo output or the console; do not estimate. If a row shows MOCK, SIMULATED or UNAVAILABLE, write that on the slide instead of a number.

Run date: `____`  ·  Machine (CPU/RAM): `____`  ·  Commit/zip: `____`

## Model

| Field | Value (fill after user runs `pnpm demo`) |
|-------|-------|
| Model name | `____` (expected `qwen2.5:0.5b`) |
| Provider | `____` (`ollama` = real, `mock` = not a measurement) |
| Blue executed | `____` (`container` expected) |
| Dataset subset | `____` adversarial + `____` benign |
| Manifest SHA-256 | `____` |

## Defence effect (step 2a)

| Metric | Value (fill after user runs `pnpm demo`) |
|--------|-------|
| n adversarial / n benign | `____` / `____` |
| ASR, Blue off | `____ %` (95% Wilson CI `____` to `____`) |
| ASR, Blue on | `____ %` (95% Wilson CI `____` to `____`) |
| Relative reduction | `____ %` |
| Benign false-refusal, Blue off / on | `____ %` / `____ %` |
| Claim level | `MEASURED` / `MOCK` |

## Isolation probes (step 1)

Fill after user runs `pnpm demo`. Copy the verdict per probe.

| Probe | Verdict (BLOCKED / LEAKED / ALLOWED control / INCONCLUSIVE) |
|-------|------|
| Red → Blue (name + IP) | `____` |
| Blue → Red (name + IP) | `____` |
| Red → Target directly | `____` |
| Blue → Target directly | `____` |
| Red DNS for Blue / Blue DNS for Red | `____` / `____` |
| Red / Blue internet egress | `____` / `____` |
| Red reads Blue secret / Blue reads Red payloads | `____` / `____` |
| Controls: own volume, gateway enrol, inference | `____` |
| Root filesystem write (Red / Blue) | `____` / `____` |
| CapEff=0, non-root, NoNewPrivs (Red / Blue) | `____` / `____` |
| Docker socket visible to Red | `____` |
| Red reads Blue config via gateway (expect 403) | `____` |
| **Total as expected** | `____ / ____` |

## Side channel: AUC per mode (step 2b)

AUC = P(Red TTFT is higher when Blue is busy). 0.5 = no signal. Fill after user runs `pnpm demo`.

| Mode | AUC | 95% bootstrap CI | n idle / busy | Source (measured / simulated) |
|------|-----|------------------|---------------|-----------|
| shared | `____` | `____` to `____` | `____` / `____` | `____` |
| resource_limited | `____` | `____` to `____` | `____` / `____` | `____` |
| cache_salted | `____` | `____` to `____` | `____` / `____` | `____` |

## Audit (step 3)

| Item | Value (fill after user runs `pnpm demo`) |
|------|-------|
| Events in chain | `____` |
| Chain verify | `PASS` / `FAIL` |
| Signed checkpoints valid | `____` |
| Tamper demo: first broken index | `____` (should equal the mutated index) |
| After restore | `PASS` / `FAIL` |
| Offline bundle verifier exit code | `____` (0 = pass) |

## Access control

| Item | Value (fill after user runs `pnpm demo`) |
|------|-------|
| Live self-test as expected | `____ / ____` |

## Tests

| Item | Value (fill after user runs `pnpm verify`) |
|------|-------|
| Test files | 5 (manifest, tokens, audit, gateway-evaluator, isolation-access) |
| Tests passing / total | `____ / ____` (read from the `node --test` summary; do not quote a number you have not seen) |
| `pnpm typecheck`, `pnpm build` | `____` |
