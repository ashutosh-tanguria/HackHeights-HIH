# OOSC Architecture Overview

The **OOSC Agent Reliability Engine** is a comprehensive evaluation, benchmarking, and reliability testing platform designed specifically for autonomous AI agents.

## System Architecture

```
+-----------------------------------------------------------------------+
|                             OOSC Web App                              |
|                   (Next.js 15 App Router / React 19)                  |
+-----------------------------------------------------------------------+
                                  │
                                  │ HTTP REST API
                                  ▼
+-----------------------------------------------------------------------+
|                             OOSC API                                  |
|                         (Fastify / Node.js)                           |
+──────────────────────────────────┬────────────────────────────────────+
│ Controllers & Services           │ Repositories & In-Memory Stores   │
│ - Agent Controller               │ - Agent Repository                 │
│ - Scenario Controller            │ - Scenario Repository              │
│ - Test Run Controller            │ - Test Run Repository              │
│ - Failure Controller             │ - Failure Repository               │
│ - Reliability Controller         │ - Test Result Repository           │
│ - Regression Controller          │ - Trace Store                      │
+──────────────────────────────────┴────────────────────────────────────+
                                  │
                                  ▼
+-----------------------------------------------------------------------+
|                         Execution Pipeline                            |
| 1. Execution Runner (Agent Adapter: HTTP / OpenAI / Custom)           |
| 2. Trace Service (Event Capture & Timing)                             |
| 3. Evaluation Runner:                                                 |
|    ├── Deterministic Evaluators (Tool Misuse, Loops, Injection, etc.) |
|    └── Semantic Evaluators (LLM Judge / Heuristic Engine)             |
+-----------------------------------------------------------------------+
                                  │
                                  ▼
+-----------------------------------------------------------------------+
|                         Target AI Agent                               |
| (Local HTTP Server / Custom Webhook / OpenAI-Compatible Endpoint)     |
+-----------------------------------------------------------------------+
```

## Key Components

1. **API Gateway & Core (`apps/api`)**:
   - Fastify HTTP server providing REST endpoints for agents, scenarios, test runs, failures, and reliability metrics.
   - Built with strict TypeScript, Zod schema validation, and dependency injection container.

2. **Frontend UI (`apps/web`)**:
   - Modern dashboard providing visualization for test runs, execution traces, failure taxonomy, reliability trends, and regression comparisons.

3. **Evaluation Engine**:
   - **Deterministic Evaluators**: Zero-cost, instantaneous rule-based checks for tool execution loops, unregistered tool misuse, prompt injection, and destructive action without confirmation.
   - **Semantic Evaluators**: Hybrid evaluation engine utilizing OpenAI LLM Judge with an intelligent local heuristic evaluator fallback for offline/cost-free evaluation.

4. **Execution Tracing**:
   - Captures sub-millisecond execution logs, tool invocation arguments, responses, and evaluation verdicts for post-run auditability.
