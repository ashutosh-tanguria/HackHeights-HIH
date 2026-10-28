"use client";

import { useState } from "react";
import { generateAdversarialTests, batchCreateScenarios } from "@/features/scenarios/api";
import { createBatchRun } from "@/features/test-runs/api";
import type { Scenario, AdversarialAttackCategory } from "@/features/scenarios/types";
import { useRouter } from "next/navigation";

export type AdversarialGeneratorModalProps = {
  scenarioId: string;
  scenarioTitle?: string;
  agentId?: string;
  isOpen: boolean;
  onClose: () => void;
};

const ALL_CATEGORIES: Array<{ id: AdversarialAttackCategory; label: string; desc: string }> = [
  { id: "safety_boundary", label: "Safety Boundary", desc: "Probes destructive & unauthorized action gates" },
  { id: "prompt_injection", label: "Prompt Injection", desc: "Tests instruction hijacking & extraction defense" },
  { id: "missing_information", label: "Missing Information", desc: "Checks if agent asks for mandatory data" },
  { id: "ambiguity", label: "Ambiguous Intent", desc: "Tests clarification questions for vague queries" },
  { id: "tool_misuse", label: "Tool Misuse", desc: "Probes calls to non-existent or inappropriate tools" },
  { id: "hallucination", label: "Hallucination Trap", desc: "Tests fact-checking vs accepting false premises" },
  { id: "policy_conflict", label: "Policy Conflict", desc: "Tests adherence under customer intimidation" },
  { id: "social_pressure", label: "Social Pressure", desc: "Tests resistance to urgency and authority claims" },
];

export function AdversarialGeneratorModal({
  scenarioId,
  scenarioTitle,
  agentId,
  isOpen,
  onClose,
}: AdversarialGeneratorModalProps) {
  const router = useRouter();
  const [count, setCount] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<string>("mixed");
  const [selectedCategories, setSelectedCategories] = useState<AdversarialAttackCategory[]>([
    "safety_boundary",
    "prompt_injection",
    "missing_information",
    "ambiguity",
  ]);
  const [focus, setFocus] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(false);
  const [generatedScenarios, setGeneratedScenarios] = useState<Scenario[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [running, setRunning] = useState<boolean>(false);

  if (!isOpen) return null;

  function toggleCategory(cat: AdversarialAttackCategory) {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
  }

  function toggleScenarioSelect(index: number) {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function selectAll() {
    if (selectedIndices.size === generatedScenarios.length) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(generatedScenarios.map((_, i) => i)));
    }
  }

  async function handleGenerate() {
    try {
      setLoading(true);
      setError(null);
      const res = await generateAdversarialTests(scenarioId, {
        count,
        difficulty,
        categories: selectedCategories,
        focus: focus.trim() || undefined,
      });

      setGeneratedScenarios(res.scenarios);
      setSelectedIndices(new Set(res.scenarios.map((_, i) => i)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate tests");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveSelected() {
    const toSave = generatedScenarios.filter((_, i) => selectedIndices.has(i));
    if (toSave.length === 0) return;

    try {
      setSaving(true);
      setError(null);
      await batchCreateScenarios(
        toSave.map((sc) => ({
          title: sc.title,
          category: sc.category,
          difficulty: sc.difficulty,
          userInput: sc.userInput,
          expectedBehavior: sc.expectedBehavior,
          forbiddenBehavior: sc.forbiddenBehavior,
          successCriteria: sc.successCriteria,
          toolSteps: sc.toolSteps ?? [],
        })),
      );
      onClose();
      router.push("/scenarios");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save scenarios");
    } finally {
      setSaving(false);
    }
  }

  async function handleRunSelected() {
    const toSave = generatedScenarios.filter((_, i) => selectedIndices.has(i));
    if (toSave.length === 0) return;

    try {
      setRunning(true);
      setError(null);

      // Save scenarios first
      const saveRes = await batchCreateScenarios(
        toSave.map((sc) => ({
          title: sc.title,
          category: sc.category,
          difficulty: sc.difficulty,
          userInput: sc.userInput,
          expectedBehavior: sc.expectedBehavior,
          forbiddenBehavior: sc.forbiddenBehavior,
          successCriteria: sc.successCriteria,
          toolSteps: sc.toolSteps ?? [],
        })),
      );

      const scenarioIds = saveRes.created.map((sc) => sc.id);

      if (agentId) {
        // Run batch evaluation immediately
        await createBatchRun({
          agentId,
          scenarioIds,
        });
        onClose();
        router.push("/runs");
      } else {
        onClose();
        router.push("/runs/new");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run scenarios");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">
              Generate Adversarial Tests
            </h2>
            <p className="text-xs text-zinc-500">
              Stress-test safety boundaries and probe weaknesses based on{" "}
              <span className="font-medium text-zinc-700">
                {scenarioTitle || scenarioId}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {generatedScenarios.length === 0 ? (
            <div className="space-y-6">
              {/* Configuration Inputs */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Number of Tests
                  </label>
                  <div className="mt-2 flex gap-2">
                    {[5, 10, 20].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setCount(num)}
                        className={`flex-1 rounded-lg border py-2 text-sm font-medium transition ${
                          count === num
                            ? "border-zinc-900 bg-zinc-900 text-white"
                            : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"
                        }`}
                      >
                        {num} Tests
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Difficulty Target
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="mt-2 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm"
                  >
                    <option value="mixed">Mixed (Recommended)</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              {/* Attack Categories */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Attack Vectors & Vulnerability Focus
                </label>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {ALL_CATEGORIES.map((cat) => {
                    const isChecked = selectedCategories.includes(cat.id);
                    return (
                      <label
                        key={cat.id}
                        className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                          isChecked
                            ? "border-zinc-900 bg-zinc-50"
                            : "border-zinc-200 bg-white hover:border-zinc-300"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleCategory(cat.id)}
                          className="mt-1 h-4 w-4 rounded border-zinc-300 text-zinc-900"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-zinc-900">
                            {cat.label}
                          </p>
                          <p className="text-[11px] text-zinc-500">
                            {cat.desc}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Optional focus */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Custom Engineering Focus (Optional)
                </label>
                <input
                  type="text"
                  value={focus}
                  onChange={(e) => setFocus(e.target.value)}
                  placeholder="e.g. Focus on refund transaction verification and card security"
                  className="mt-2 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm"
                />
              </div>
            </div>
          ) : (
            /* Review Generated Scenarios */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-zinc-700">
                  Generated {generatedScenarios.length} Scenarios (
                  {selectedIndices.size} selected)
                </p>
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-xs font-medium text-zinc-600 hover:text-zinc-900 underline"
                >
                  {selectedIndices.size === generatedScenarios.length
                    ? "Deselect All"
                    : "Select All"}
                </button>
              </div>

              <div className="space-y-3">
                {generatedScenarios.map((sc, index) => {
                  const isSelected = selectedIndices.has(index);
                  return (
                    <div
                      key={sc.id || index}
                      onClick={() => toggleScenarioSelect(index)}
                      className={`cursor-pointer rounded-xl border p-4 transition ${
                        isSelected
                          ? "border-zinc-900 bg-zinc-50/70"
                          : "border-zinc-200 bg-white hover:border-zinc-300 opacity-60"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="h-4 w-4 rounded border-zinc-300 text-zinc-900"
                          />
                          <h4 className="font-semibold text-sm text-zinc-900">
                            {sc.title}
                          </h4>
                        </div>
                        <div className="flex gap-1.5 text-[11px]">
                          <span className="rounded-full bg-zinc-200 px-2 py-0.5 font-medium text-zinc-700">
                            {sc.difficulty}
                          </span>
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 font-medium text-blue-700">
                            {sc.category}
                          </span>
                        </div>
                      </div>

                      <div className="mt-2 text-xs text-zinc-600 bg-white rounded-lg border border-zinc-200 p-2.5">
                        <span className="font-semibold text-zinc-800">User Input: </span>
                        &ldquo;{sc.userInput}&rdquo;
                      </div>

                      <div className="mt-2 grid gap-2 sm:grid-cols-2 text-[11px] text-zinc-500">
                        <div>
                          <span className="font-medium text-emerald-700">Expected: </span>
                          {sc.expectedBehavior[0]}
                        </div>
                        <div>
                          <span className="font-medium text-red-700">Forbidden: </span>
                          {sc.forbiddenBehavior[0] || "None specified"}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t bg-zinc-50 px-6 py-4 rounded-b-2xl">
          {generatedScenarios.length === 0 ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading || selectedCategories.length === 0}
                className="flex items-center gap-2 rounded-lg bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Generating {count} Tests...
                  </>
                ) : (
                  `Generate ${count} Adversarial Tests`
                )}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setGeneratedScenarios([])}
                className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
              >
                ← Back to Config
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSaveSelected}
                  disabled={saving || running || selectedIndices.size === 0}
                  className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100 disabled:opacity-50"
                >
                  {saving ? "Saving..." : `Save ${selectedIndices.size} Scenarios`}
                </button>
                <button
                  type="button"
                  onClick={handleRunSelected}
                  disabled={saving || running || selectedIndices.size === 0}
                  className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
                >
                  {running ? (
                    <>
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Evaluating Batch...
                    </>
                  ) : (
                    `Run Batch Evaluation (${selectedIndices.size})`
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
