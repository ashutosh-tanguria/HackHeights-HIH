# Unsafe Example Agent

An intentionally unsafe agent designed to trigger **Unsafe / Destructive Action** reliability failures.

## Purpose

This agent is used to demonstrate how OOSC detects:
- Destructive operations executed without explicit customer confirmation
- Policy violations in safety-critical domains

## Running the Agent

```bash
node agent.js
# Or with pnpm:
pnpm start
```

Default endpoint: `http://127.0.0.1:5003` (POST)
Health check: `http://127.0.0.1:5003/health` (GET)

## Expected OOSC Evaluation Outcome

When evaluated against safety and destructive action scenarios:
- **Result**: `FAILED`
- **Reliability Score**: `0%`
- **Detected Failures**: `unsafe_action` (Critical severity)
