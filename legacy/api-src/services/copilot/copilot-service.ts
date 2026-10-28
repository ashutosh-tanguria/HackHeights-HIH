import { z } from "zod";
import type {
  AgentRepository,
  TestRunRepository,
  ScenarioRepository,
  FailureRepository,
} from "../../repositories";
import type { HealthService } from "../health/health-service";
import type { DiagnosisService } from "../diagnosis/diagnosis-service";
import type { AIProvider } from "../ai";
import { getAIProvider } from "../ai";
import type {
  CopilotAnalysis,
  CopilotIssue,
  CopilotRecommendation,
} from "../../models/copilot";

const aiCopilotResponseSchema = z.object({
  summary: z.string(),
  changeDescription: z.string(),
  topIssues: z.array(
    z.object({
      title: z.string(),
      severity: z.enum(["low", "medium", "high", "critical"]),
      category: z.string(),
      description: z.string(),
      impact: z.string(),
    }),
  ),
  rootCauses: z.array(z.string()),
  recommendations: z.array(
    z.object({
      title: z.string(),
      action: z.string(),
      rationale: z.string(),
      actionType: z.enum([
        "generate_tests",
        "run_regression",
        "view_failures",
        "fix_agent",
      ]),
    }),
  ),
  suggestedTests: z.array(z.string()),
  nextActions: z.array(z.string()),
});

export class CopilotService {
  constructor(
    private readonly agentRepository: AgentRepository,
    private readonly testRunRepository: TestRunRepository,
    private readonly scenarioRepository: ScenarioRepository,
    private readonly failureRepository: FailureRepository,
    private readonly healthService: HealthService,
    private readonly diagnosisService?: DiagnosisService,
    private readonly aiProvider: AIProvider = getAIProvider(),
  ) {}

  async getGlobalCopilotAnalysis(): Promise<CopilotAnalysis> {
    const health = this.healthService.calculateAgentHealth();
    const agents = this.agentRepository.findAll();
    const runs = this.testRunRepository.findAll();
    const failures = this.failureRepository.findAll();
    const scenarios = this.scenarioRepository.findAll();

    return this.buildCopilotAnalysis(
      null,
      null,
      health,
      runs,
      failures,
      scenarios,
    );
  }

  async getAgentCopilotAnalysis(agentId: string): Promise<CopilotAnalysis> {
    const agent = this.agentRepository.findById(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    const health = this.healthService.calculateAgentHealth(agentId);
    const runs = this.testRunRepository
      .findAll()
      .filter((r) => r.agentId === agentId);
    const runIds = new Set(runs.map((r) => r.id));
    const failures = this.failureRepository
      .findAll()
      .filter((f) => runIds.has(f.runId));
    const scenarios = this.scenarioRepository.findAll();

    return this.buildCopilotAnalysis(
      agent.id,
      agent.name,
      health,
      runs,
      failures,
      scenarios,
    );
  }

  private async buildCopilotAnalysis(
    agentId: string | null,
    agentName: string | null,
    health: ReturnType<HealthService["calculateAgentHealth"]>,
    runs: ReturnType<TestRunRepository["findAll"]>,
    failures: ReturnType<FailureRepository["findAll"]>,
    scenarios: ReturnType<ScenarioRepository["findAll"]>,
  ): Promise<CopilotAnalysis> {
    const now = new Date().toISOString();

    // Deterministic issue gathering
    const failureTypeCounts = new Map<string, number>();
    for (const f of failures) {
      failureTypeCounts.set(f.type, (failureTypeCounts.get(f.type) ?? 0) + 1);
    }

    const topIssues: CopilotIssue[] = [];
    for (const [type, count] of failureTypeCounts.entries()) {
      let severity: CopilotIssue["severity"] = "medium";
      let title = type.replace(/_/g, " ").toUpperCase();
      let category = "Correctness";
      let impact = `Affects ${count} test evaluation(s)`;

      if (type === "unsafe_action") {
        severity = "critical";
        title = "Destructive Confirmation Gate Bypass";
        category = "Safety & Governance";
        impact = "Critical safety risk: irreversible actions executed without confirmation";
      } else if (type === "prompt_injection") {
        severity = "high";
        title = "Adversarial Prompt Defense Vulnerability";
        category = "Security & Prompt Injection";
        impact = "Agent susceptible to system prompt extraction and instruction override";
      } else if (type === "hallucinated_success") {
        severity = "high";
        title = "Ungrounded Success Affirmations";
        category = "Correctness & Verification";
        impact = "Agent falsely claims tasks completed without verification";
      } else if (type === "tool_loop") {
        severity = "medium";
        title = "Tool Invocation Cycles";
        category = "Tool Orchestration";
        impact = "Redundant tool calls degrade latency and token efficiency";
      }

      topIssues.push({
        id: crypto.randomUUID(),
        title,
        severity,
        category,
        description: `Observed ${count} occurrence(s) across recent evaluation runs.`,
        impact,
        affectedScenarios: scenarios.slice(0, 2).map((s) => s.title),
      });
    }

    // Sort issues by severity
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    topIssues.sort(
      (a, b) => severityOrder[a.severity] - severityOrder[b.severity],
    );

    if (this.aiProvider.isAvailable()) {
      try {
        const prompt = `
Analyze the following reliability data for ${agentName ? `Agent "${agentName}"` : "the global Agent Fleet"}:

HEALTH SCORE: ${health.overallScore} / 100 (${health.status.toUpperCase()})
DIMENSIONS:
- Correctness: ${health.dimensions.correctness}%
- Safety: ${health.dimensions.safety}%
- Tool Reliability: ${health.dimensions.toolReliability}%
- Robustness: ${health.dimensions.robustness}%
- Regression Stability: ${health.dimensions.regressionStability}%

EVALUATION STATS:
- Total Evaluations: ${runs.length}
- Total Failures: ${failures.length}
- Top Failure Types: ${JSON.stringify(Array.from(failureTypeCounts.entries()))}

TASK:
Provide a senior reliability engineering copilot briefing:
1. summary (1-2 sentences summarizing state and biggest risk)
2. changeDescription (trend description, e.g. "Reliability remained stable over last 10 evaluations")
3. topIssues (list of 2-4 prioritized issues with title, severity, category, description, impact)
4. rootCauses (list of 2-3 root causes explaining why these failures happen)
5. recommendations (list of 3 actionable items with title, action, rationale, actionType)
6. suggestedTests (list of 3 specific new stress-test scenarios to add)
7. nextActions (list of 3 immediate engineering steps)
`;

        const aiResult = await this.aiProvider.generateStructured(
          prompt,
          aiCopilotResponseSchema,
          "You are the OOSC Reliability Copilot, an AI engineer diagnosing autonomous agent reliability and regression risks.",
        );

        if (aiResult) {
          return {
            agentId,
            agentName,
            summary: aiResult.summary,
            healthStatus: health.status,
            healthScore: health.overallScore,
            dimensions: health.dimensions,
            changeDescription: aiResult.changeDescription,
            topIssues: aiResult.topIssues.map((ti) => ({
              id: crypto.randomUUID(),
              title: ti.title,
              severity: ti.severity,
              category: ti.category,
              description: ti.description,
              impact: ti.impact,
              affectedScenarios: scenarios.slice(0, 2).map((s) => s.title),
            })),
            rootCauses: aiResult.rootCauses,
            recommendations: aiResult.recommendations.map((r) => ({
              id: crypto.randomUUID(),
              title: r.title,
              action: r.action,
              rationale: r.rationale,
              actionType: r.actionType,
            })),
            suggestedTests: aiResult.suggestedTests,
            nextActions: aiResult.nextActions,
            isAiGenerated: true,
            generatedAt: now,
          };
        }
      } catch {
        // Fall back to deterministic analysis
      }
    }

    // Deterministic Copilot analysis
    const rootCauses: string[] = [];
    const recommendations: CopilotRecommendation[] = [];
    const suggestedTests: string[] = [];
    const nextActions: string[] = [];

    if (failures.some((f) => f.type === "unsafe_action")) {
      rootCauses.push("Agent lacks explicit user confirmation check prior to calling destructive tools.");
      recommendations.push({
        id: crypto.randomUUID(),
        title: "Enforce Confirmation Gate",
        action: "Require two-step confirmation for destructive actions in the system prompt.",
        rationale: "Eliminates critical safety violations during refund or deletion operations.",
        actionType: "fix_agent",
      });
      suggestedTests.push("User requests immediate action without confirmation");
    }

    if (failures.some((f) => f.type === "prompt_injection")) {
      rootCauses.push("System prompt does not enforce strict input boundary isolation.");
      recommendations.push({
        id: crypto.randomUUID(),
        title: "Harden Prompt Boundaries",
        action: "Add explicit delimiters around user input and instruct agent to reject roleplay overrides.",
        rationale: "Protects proprietary instructions and system credentials from jailbreaks.",
        actionType: "generate_tests",
      });
      suggestedTests.push("Adversarial override attempt with system prompt extraction");
    }

    if (recommendations.length === 0) {
      recommendations.push({
        id: crypto.randomUUID(),
        title: "Expand Adversarial Coverage",
        action: "Generate boundary and stress tests to probe edge cases.",
        rationale: "Proactively uncovers hidden failure modes before production deployments.",
        actionType: "generate_tests",
      });
      suggestedTests.push("Ambiguous user inquiry with missing transaction ID");
    }

    recommendations.push({
      id: crypto.randomUUID(),
      title: "Run Regression Benchmark",
      action: "Compare latest evaluation against established baseline run.",
      rationale: "Ensures newly deployed prompt changes do not degrade existing behavior.",
      actionType: "run_regression",
    });

    nextActions.push("Generate 5 adversarial scenarios to stress-test safety boundaries");
    nextActions.push("Run batch evaluation across all active test suites");
    nextActions.push("Review open high-severity failures in failure tracker");

    return {
      agentId,
      agentName,
      summary:
        failures.length > 0
          ? `Reliability is ${health.status} (${health.overallScore}/100) with ${failures.length} failure(s) recorded across evaluations.`
          : `All systems operating with high reliability (${health.overallScore}/100) across active scenarios.`,
      healthStatus: health.status,
      healthScore: health.overallScore,
      dimensions: health.dimensions,
      changeDescription: `Reliability evaluated across ${runs.length} test run(s) with ${health.recentRegressions} recent regression(s).`,
      topIssues: topIssues.slice(0, 3),
      rootCauses:
        rootCauses.length > 0
          ? rootCauses
          : ["System prompt instructions align well with current test suite criteria."],
      recommendations,
      suggestedTests,
      nextActions,
      isAiGenerated: false,
      generatedAt: now,
    };
  }
}
