import type { Scenario } from "../models";

const scenarios: Scenario[] = [];

export class ScenarioRepository {
  findAll(): Scenario[] {
    return scenarios;
  }

  findById(id: string): Scenario | null {
    return (
      scenarios.find((scenario) => scenario.id === id) ??
      null
    );
  }

  create(scenario: Scenario): Scenario {
    scenarios.push(scenario);

    return scenario;
  }

  update(
    id: string,
    data: Partial<Scenario>,
  ): Scenario | null {
    const scenario = this.findById(id);

    if (!scenario) {
      return null;
    }

    Object.assign(scenario, {
      ...data,
      updatedAt: new Date().toISOString(),
    });

    return scenario;
  }

  delete(id: string): boolean {
    const index = scenarios.findIndex(
      (scenario) => scenario.id === id,
    );

    if (index === -1) {
      return false;
    }

    scenarios.splice(index, 1);

    return true;
  }
}