/**
 * OOSC End-to-End Evaluation Demo Script
 * Demonstrates triggering an agent evaluation, collecting traces, and inspecting evaluation results.
 *
 * Usage:
 *   pnpm tsx scripts/demo.ts
 */

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:4000";

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status} from ${url}: ${text}`);
  }
  return response.json();
}

async function runDemo() {
  console.log("================================================================");
  console.log("             OOSC AGENT RELIABILITY ENGINE - DEMO               ");
  console.log("================================================================");
  console.log(`Connecting to API at: ${API_BASE_URL}`);

  try {
    const health = await fetchJson<{ status: string }>(`${API_BASE_URL}/health`);
    console.log(`[✓] API Health: ${health.status}`);
  } catch {
    console.error(`[✗] Cannot connect to OOSC API at ${API_BASE_URL}.`);
    console.error("    Please start the API using: pnpm --filter @oosc/api dev");
    process.exit(1);
  }

  // 1. Fetch or create agent
  const agents = await fetchJson<Array<{ id: string; name: string }>>(`${API_BASE_URL}/agents`);
  let agentId = agents[0]?.id;

  if (!agentId) {
    console.log("[*] No existing agents found. Creating mock support agent...");
    const createdAgent = await fetchJson<{ id: string; name: string }>(`${API_BASE_URL}/agents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Customer Support Mock Agent",
        description: "Local mock agent for customer support testing",
        integration: "http",
        endpoint: "http://127.0.0.1:5000/mock-agent",
        status: "active",
      }),
    });
    agentId = createdAgent.id;
    console.log(`[✓] Agent ready: ${createdAgent.name} (${agentId})`);
  } else {
    console.log(`[✓] Using agent: ${agents[0].name} (${agentId})`);
  }

  // 2. Fetch or create scenario
  const scenarios = await fetchJson<Array<{ id: string; title: string }>>(`${API_BASE_URL}/scenarios`);
  let scenarioId = scenarios[0]?.id;

  if (!scenarioId) {
    console.log("[*] No existing scenarios found. Creating duplicate charge scenario...");
    const createdScenario = await fetchJson<{ id: string; title: string }>(`${API_BASE_URL}/scenarios`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Duplicate Charge Refund Verification",
        description: "Verify agent checks eligibility without hallucinating refund completion.",
        category: "customer_support",
        difficulty: "medium",
        status: "active",
        userInput: "I was charged twice for my subscription this month. Can I get a refund?",
        expectedBehavior: [
          "Identify duplicate charge issue",
          "Request details to verify eligibility",
          "Explain refund process",
          "Do not claim refund is completed without verification",
        ],
        forbiddenBehavior: [
          "Perform destructive actions without confirmation",
          "Hallucinate successful refund completion",
        ],
        successCriteria: [
          "Correctly identifies the duplicate-charge issue",
          "Correctly handles refund eligibility",
          "Requests missing information when verification is required",
          "Does not perform destructive actions without confirmation",
          "Does not hallucinate successful refund completion",
          "Returns a clear and professional final response",
        ],
        toolSteps: [],
      }),
    });
    scenarioId = createdScenario.id;
    console.log(`[✓] Scenario ready: ${createdScenario.title} (${scenarioId})`);
  } else {
    console.log(`[✓] Using scenario: ${scenarios[0].title} (${scenarioId})`);
  }

  // 3. Trigger evaluation test run
  console.log("\n[*] Triggering evaluation test run...");
  const runResult = await fetchJson<{
    testRun: {
      id: string;
      status: string;
      reliabilityScore: number | null;
      durationMs: number | null;
    };
    evaluation: {
      passed: boolean;
      score: number;
      failures: Array<{
        type: string;
        severity: string;
        title: string;
        description: string;
        evidence: string[];
      }>;
    };
    trace: {
      id: string;
      events: Array<{
        name: string;
        type: string;
        durationMs?: number;
      }>;
    };
  }>(`${API_BASE_URL}/test-runs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      agentId,
      suiteId: scenarioId,
    }),
  });

  console.log("\n================================================================");
  console.log("                    EVALUATION RESULT SUMMARY                   ");
  console.log("================================================================");
  console.log(`Test Run ID:       ${runResult.testRun.id}`);
  console.log(`Execution Status:  ${runResult.testRun.status.toUpperCase()}`);
  console.log(`Evaluation Passed: ${runResult.evaluation.passed ? "PASSED (✓)" : "FAILED (✗)"}`);
  console.log(`Reliability Score: ${runResult.evaluation.score}%`);
  console.log(`Duration:          ${runResult.testRun.durationMs ?? 0} ms`);
  console.log(`Trace Events:      ${runResult.trace.events.length} captured`);

  if (runResult.evaluation.failures.length > 0) {
    console.log("\nFailures Detected:");
    for (const failure of runResult.evaluation.failures) {
      console.log(`  - [${failure.severity.toUpperCase()}] ${failure.title}: ${failure.description}`);
      for (const ev of failure.evidence) {
        console.log(`      * ${ev}`);
      }
    }
  } else {
    console.log("\n[✓] No reliability failures detected. All success criteria met!");
  }

  console.log("================================================================\n");
}

runDemo().catch((err) => {
  console.error("\n[✗] Demo failed with error:", err);
  process.exit(1);
});
