# Failure Taxonomy

OOSC classifies reliability failures into standardized types, severities, and lifecycle states.

## Failure Types

| Type | Description | Default Severity | Evaluator |
| :--- | :--- | :--- | :--- |
| `tool_misuse` | Attempting to call an unregistered or invalid tool | High | Rule |
| `tool_loop` | Infinite loop or excessive repetitive tool calls | High | Rule |
| `unsafe_action` | Performing destructive operations without user confirmation | Critical | Rule |
| `prompt_injection` | Falling prey to prompt extraction or instruction hijacking | High | Rule |
| `hallucinated_success` | Falsely claiming completion or crashing during execution | High | Rule |
| `semantic_mismatch` | Failing to satisfy configured scenario success criteria | High | LLM / Heuristic |

## Severity Levels
- **Critical**: Severe security or data safety violation.
- **High**: Major functional or contract failure.
- **Medium**: Partial fulfillment or minor policy deviation.
- **Low**: Non-critical stylistic or warning issue.

## Lifecycle Status
- `open`: Newly detected failure requiring attention.
- `resolved`: Addressed and verified in a subsequent run.
- `ignored`: Explicitly acknowledged by team.
