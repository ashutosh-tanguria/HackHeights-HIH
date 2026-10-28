# Agent Integrations & Adapters

OOSC connects to agents through modular adapters.

## Supported Integrations

### 1. HTTP Webhook Adapter (`http`)
Invokes standard HTTP webhooks.
- **Protocol**: `POST <agent.endpoint>`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "input": "User query from scenario",
    "scenarioId": "scenario-uuid"
  }
  ```
- **Expected Response**:
  - Raw plain text string, OR
  - JSON object containing `output`, `response`, or `text`.

### 2. OpenAI-Compatible Adapter (`openai`)
Invokes OpenAI chat completions models or compatible proxy gateways.
- **Protocol**: `POST https://api.openai.com/v1/chat/completions` (or custom endpoint)
- **Model**: Configurable (e.g. `gpt-4o-mini`, `gpt-4o`)
- **Authentication**: `Bearer ${OPENAI_API_KEY}`

### 3. Custom Adapter (`custom`)
Flexible adapter supporting structured JSON payloads with scenario metadata and configurable model overrides.
