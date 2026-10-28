import {
  AgentRepository,
  FailureRepository,
  ScenarioRepository,
  TestResultRepository,
  TestRunRepository,
} from "./repositories";
import {
  TraceStore,
} from "./services";

export const agentRepository =
  new AgentRepository();

export const scenarioRepository =
  new ScenarioRepository();

export const testRunRepository =
  new TestRunRepository();

export const failureRepository =
  new FailureRepository();

export const testResultRepository =
  new TestResultRepository();

export const traceStore =
  new TraceStore();

import { DiagnosisService } from "./services/diagnosis";

export const diagnosisService =
  new DiagnosisService(
    failureRepository,
    testRunRepository,
    scenarioRepository,
    agentRepository,
    traceStore,
  );

import { AdversarialGeneratorService } from "./services/adversarial";

export const adversarialGeneratorService =
  new AdversarialGeneratorService(
    scenarioRepository,
  );

import {
  ExecutionPipeline,
  ExecutionRunner,
  ExecutionService,
  EvaluationRunner,
  EvaluationService,
  TraceService,
  BatchEvaluationService,
} from "./services";

export const executionService =
  new ExecutionService();

export const executionRunner =
  new ExecutionRunner(executionService);

export const evaluationService =
  new EvaluationService();

export const evaluationRunner =
  new EvaluationRunner(evaluationService);

export const traceService =
  new TraceService();

export const executionPipeline =
  new ExecutionPipeline(
    executionRunner,
    evaluationRunner,
    traceService,
    traceStore,
  );

export const batchEvaluationService =
  new BatchEvaluationService(
    agentRepository,
    scenarioRepository,
    testRunRepository,
    testResultRepository,
    failureRepository,
    executionPipeline,
    diagnosisService,
  );

import { HealthService } from "./services/health";
import { CopilotService } from "./services/copilot";

export const healthService =
  new HealthService(
    agentRepository,
    testRunRepository,
    scenarioRepository,
    failureRepository,
  );

export const copilotService =
  new CopilotService(
    agentRepository,
    testRunRepository,
    scenarioRepository,
    failureRepository,
    healthService,
    diagnosisService,
  );


