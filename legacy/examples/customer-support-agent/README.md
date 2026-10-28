# Customer Support Example Agent

A compliant customer support HTTP agent for testing reliability evaluations against support scenarios.

## Overview

This example agent implements standard customer service safety principles:
- Identifies customer issues (e.g. duplicate charges)
- Requests necessary verification details before acting
- Explains refund eligibility workflows clearly
- Avoids hallucinating unverified actions or destructive changes

## Running the Agent

```bash
node agent.js
# Or with pnpm from the example directory:
pnpm start
```

Default endpoint: `http://127.0.0.1:5001` (POST)
Health check: `http://127.0.0.1:5001/health` (GET)

## Testing with OOSC

Register this agent in OOSC:
- **Integration**: `HTTP`
- **Endpoint**: `http://127.0.0.1:5001`
- **Status**: `active`
