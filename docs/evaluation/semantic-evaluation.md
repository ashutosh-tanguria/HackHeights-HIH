# Semantic Evaluation

Semantic evaluation assesses whether the natural language response of an agent genuinely satisfies the scenario's configured success criteria.

## Dual-Mode Architecture

1. **LLM Judge Mode (`OPENAI_API_KEY` configured)**:
   - Uses OpenAI structured JSON outputs with models like `gpt-4o-mini` or `gpt-4o`.
   - Sends scenario inputs, expected behaviors, forbidden behaviors, and the agent's response.
   - Evaluates criteria independently with detailed reasoning and matched/failed breakdowns.

2. **Heuristic Semantic Engine (Zero-Cost / Offline Mode)**:
   - Evaluates criteria using domain concept extraction, synonym mapping, token overlap, and safety constraint analysis.
   - Accurately checks negative safety constraints (e.g. `Does not hallucinate...`, `Does not perform destructive actions without confirmation`).
   - Ensures local and free test suites run reliably without external API dependencies.
