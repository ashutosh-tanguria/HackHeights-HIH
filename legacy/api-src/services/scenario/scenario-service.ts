import {
  ScenarioRepository,
} from "../../repositories";
import type { Scenario } from "../../models";
import type { CreateScenarioInput } from "../../schemas";

export class ScenarioService {
  constructor(
    private readonly scenarioRepository: ScenarioRepository,
  ) {}

  findAll(): Scenario[] {
    return this.scenarioRepository.findAll();
  }

  findById(id: string): Scenario | null {
    return this.scenarioRepository.findById(id);
  }

  create(input: CreateScenarioInput): Scenario {
    const now = new Date().toISOString();

    const scenario: Scenario = {
      id: crypto.randomUUID(),
      title: input.title,
      category: input.category,
      difficulty: input.difficulty,
      userInput: input.userInput,
      expectedBehavior: input.expectedBehavior,
      forbiddenBehavior: input.forbiddenBehavior,
      successCriteria: input.successCriteria,
      toolSteps: input.toolSteps ?? [],
      status: "draft",
      createdAt: now,
      updatedAt: now,
    };

    return this.scenarioRepository.create(scenario);
  }

  update(
    id: string,
    data: Partial<Scenario>,
  ): Scenario | null {
    return this.scenarioRepository.update(id, data);
  }

  delete(id: string): boolean {
    return this.scenarioRepository.delete(id);
  }
}