# Execution & Evaluation Lifecycle

This document describes the lifecycle of an evaluation test run from initialization to failure reporting.

## Lifecycle Stages

```
1. POST /test-runs
       │
       ▼
2. Context Initialization (Execution Plan & Tool Registry)
       │
       ▼
3. Agent Invocation (Adapter: HTTP / OpenAI / Custom)
       │
       ▼
4. Trace Event Capture (Timing & I/O Recording)
       │
       ▼
5. Deterministic Evaluation
   ├── Tool Loop Detection
   ├── Tool Misuse Detection
   ├── Destructive Action Safety Check
   └── Prompt Injection Detection
       │
       ▼
6. Semantic Evaluation (Success Criteria Matching via LLM / Heuristic)
       │
       ▼
7. Aggregation & Scoring (Failures, Reliability Score, Test Results)
       │
       ▼
8. Persistence & Response
```

## Stage Details

### 1. Test Run Request
Client issues `POST /test-runs` with `{ agentId: string, suiteId: string }`.
The API verifies that both the target agent and scenario exist.

### 2. Execution Context
`ExecutionPipeline` creates an `ExecutionContext` populated with the scenario's defined `toolSteps` and tool definitions.

### 3. Agent Execution
`ExecutionRunner` invokes the matching `AgentAdapter` (`HttpAgentAdapter`, `OpenAIAgentAdapter`, or `CustomAgentAdapter`). The adapter sends the scenario's `userInput` to the agent and awaits the response with a 30-second timeout.

### 4. Evaluation Phase
`EvaluationRunner` orchestrates two evaluation tiers:
- **Deterministic**: Evaluates tool calls against strict safety rules.
- **Semantic**: Compares agent output against `scenario.successCriteria`.

### 5. Verdict & Trace Storage
- Generates `Failure` records for each detected violation.
- Computes `reliabilityScore` (0–100%).
- Emits execution trace to `TraceStore`.
- Updates agent aggregate statistics (`totalTests`, `passedTests`, `failedTests`).
