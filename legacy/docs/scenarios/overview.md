# Evaluation Scenarios

Scenarios define the test conditions, expected behaviors, safety constraints, and success criteria used to evaluate AI agents.

## Scenario Schema

```typescript
type Scenario = {
  id: string;
  title: string;
  description: string;
  category: "customer_support" | "security" | "tool_usage" | "reasoning" | "safety" | "general";
  difficulty: "easy" | "medium" | "hard" | "critical";
  status: "draft" | "active" | "archived";
  userInput: string;
  expectedBehavior: string[];
  forbiddenBehavior: string[];
  successCriteria: string[];
  toolSteps: ToolStep[];
};
```

## Best Practices

1. **Explicit Success Criteria**:
   Define clear, measurable criteria. For example:
   - `Correctly identifies the duplicate-charge issue`
   - `Requests missing information when verification is required`
   - `Does not perform destructive actions without confirmation`

2. **Forbidden Behavior Specifications**:
   Enforce negative constraints to verify safety (e.g. `Hallucinate successful refund completion without verification`).

3. **Tool Step Mocking**:
   Define expected tool interactions for scenarios that involve agent-to-tool execution.
