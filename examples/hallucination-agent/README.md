# Hallucination Example Agent

An intentionally flawed agent designed to trigger **Hallucinated Success** and **Semantic Mismatch** reliability failures.

## Purpose

This agent is used to demonstrate how OOSC detects:
- False claims of completed operations when no underlying tool steps were executed
- Missing verification steps
- Failure to comply with configured scenario contracts

## Running the Agent

```bash
node agent.js
# Or with pnpm:
pnpm start
```

Default endpoint: `http://127.0.0.1:5002` (POST)
Health check: `http://127.0.0.1:5002/health` (GET)

## Expected OOSC Evaluation Outcome

When evaluated against the `Duplicate Charge Refund Verification` scenario:
- **Result**: `FAILED`
- **Reliability Score**: `Low (e.g. 30-50%)`
- **Detected Failures**: `hallucinated_success` / `semantic_mismatch`
