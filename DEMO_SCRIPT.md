# Demo script (3 to 4 minutes)

Story: **BLOCKED, then MEASURED, then VERIFIED.** Say the closing line exactly: *"Hack in Hills, powered by TinyFish."*

## Before recording (do once, off camera)

```powershell
cd "Bayora - Ashutosh"
pnpm install ; pnpm setup
docker compose --profile pull run --rm puller      # wait for PULL_OK
docker compose up -d --build ; docker compose ps   # gateway = healthy
pnpm demo                                           # warm-up run: loads the model, fills the database
start http://localhost:3000/console
```

Keep two windows side by side: the console and a PowerShell prompt in the project folder. Everything you show is read from the API; if a number looks odd, say so on camera, do not edit it.

## 0:00 to 0:30 · The problem

Say: "AI safety testing puts Red attackers, Blue defenders and the model in one sandbox. That breaks the test: Red can be watched, Blue's rules can be inferred, and a shared cache leaks timing. Our rule is communication is allowed, observation is not."

Show: console **Overview** and the architecture diagram in the README (three internal networks, one gateway).

## 0:30 to 1:20 · BLOCKED

Command (or the Run probes button on **Isolation probes**):

```powershell
docker compose ps
pnpm demo        # first section only, or press "Run probes" in the console
```

Say: "These are real commands run with docker exec inside the Red and Blue containers. Red cannot reach Blue by name or by IP, cannot resolve it, cannot reach the model directly, cannot reach the internet, cannot read Blue's secret volume, holds no capabilities, and cannot write its root filesystem. The green controls prove the tests are not just broken: Red and Blue can each reach the gateway with their own token and get a completion."

Click one row to show the raw `docker exec` evidence. Point out `UNAVAILABLE` is what you would see if Docker were down.

## 1:20 to 2:30 · MEASURED

Console **Evaluation**, press Run evaluation (or show the finished run from the warm-up):

Say: "Same real prompts from AdvBench, HarmBench, JailbreakBench and Gandalf, sent through the gateway to a real model, qwen2.5 0.5B, twice: Blue defence off, then on. Here is attack success with n and a 95% Wilson interval, the relative reduction, and the false-refusal rate on benign prompts. The defence flag is inside the signed token, so Red cannot switch it. Refusal detection is a keyword heuristic and we say so."

Console **Side-channel**: "Can Red tell whether Blue is busy from its own time-to-first-token? Here is the AUC with a bootstrap interval for shared, resource-limited and cache-salted modes, computed from stored samples. 0.5 means no signal. If the interval includes 0.5 we only claim 'not detectable at this n'." Mention the source badge: MEASURED for a real model, SIMULATED/MOCK otherwise.

## 2:30 to 3:30 · VERIFIED

Console **Audit**:

Say: "Every probe, token, denial and evaluation is an event in a SHA-256 hash chain with Ed25519 signed checkpoints." Click **Run tamper demo**: "I change one stored event. Verification fails at exactly that index. I restore it and it passes again."

PowerShell:

```powershell
pnpm demo                                             # or, after a prior demo run:
node scripts/verify-bundle.mjs bayora-audit-bundle.json
```

Say: "The exported bundle verifies offline with a 40-line script that needs no API and no database."

Console **Access control**, press Run live self-test: "Forged, expired and wrong-tenant tokens get 401 or 403; Red asking for Blue's defence config gets 403."

## 3:30 to 4:00 · Honest limits and close

Console **Threat model**: "We list what is not protected: shared host kernel, the Docker socket the gateway needs for probes, GPU and power timing channels, single node. gVisor and Kubernetes manifests are in the repo marked PLANNED."

Close: **"Hack in Hills, powered by TinyFish."**

## If something fails on camera

* Probes show `UNAVAILABLE`: Docker or the containers are down. `docker compose up -d`, rerun.
* Evaluation returns HTTP 502 / banner "Target model UNAVAILABLE": the model is not pulled. Run the `puller` command again. This is the designed behaviour (no mock fallback).
* MOCK badge visible: `.env` has `TARGET_LLM_PROVIDER=mock`. Set `ollama`, `docker compose up -d`.
