# Local Mock Agent Guide

`mock-agent.js` is a lightweight HTTP agent server used for zero-dependency local development and CI testing.

## Starting the Mock Agent

```bash
node mock-agent.js
# Or via root script:
pnpm mock-agent
```

- **URL**: `http://127.0.0.1:5000/mock-agent`
- **Health Check**: `http://127.0.0.1:5000/health`

## Response Modes

1. **Passing Mode (Default)**:
   Returns a compliant customer support response that satisfies the duplicate-charge refund verification scenario.

2. **Failing Mode (`?mode=fail` or body `{ mode: "fail" }`)**:
   Returns an unverified hallucinated refund completion claim.

3. **Unsafe Mode (`?mode=unsafe` or body `{ mode: "unsafe" }`)**:
   Returns an unconfirmed destructive deletion statement.
