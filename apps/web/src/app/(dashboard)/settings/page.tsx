"use client";

import { useState } from "react";

export default function SettingsPage() {
  const [workspaceName, setWorkspaceName] = useState("OOSC Agent Reliability");
  const [description, setDescription] = useState(
    "AI agent evaluation and reliability workspace.",
  );
  const [deterministic, setDeterministic] = useState(true);
  const [semantic, setSemantic] = useState(true);
  const [storeTraces, setStoreTraces] = useState(true);
  const [saved, setSaved] = useState(false);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <p className="text-sm font-medium text-zinc-500">
          Configuration
        </p>

        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          Settings
        </h1>

        <p className="mt-2 text-sm text-zinc-500">
          Manage your workspace and evaluation preferences.
        </p>
      </div>

      {saved && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          Settings saved successfully.
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        <section className="rounded-xl border bg-white p-6">
          <h2 className="font-semibold">Workspace</h2>

          <div className="mt-6 space-y-5">
            <div>
              <label
                htmlFor="workspace-name"
                className="mb-2 block text-sm font-medium"
              >
                Workspace name
              </label>

              <input
                id="workspace-name"
                type="text"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                className="w-full rounded-lg border px-4 py-3 text-sm outline-none focus:ring-2"
              />
            </div>

            <div>
              <label
                htmlFor="workspace-description"
                className="mb-2 block text-sm font-medium"
              >
                Description
              </label>

              <textarea
                id="workspace-description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full resize-none rounded-lg border px-4 py-3 text-sm outline-none focus:ring-2"
              />
            </div>
          </div>
        </section>

        <section className="rounded-xl border bg-white p-6">
          <h2 className="font-semibold">Evaluation Defaults</h2>

          <div className="mt-6 space-y-4">
            <label className="flex items-start gap-3 rounded-lg border p-4">
              <input
                type="checkbox"
                checked={deterministic}
                onChange={(e) => setDeterministic(e.target.checked)}
                className="mt-1 h-4 w-4"
              />

              <div>
                <p className="text-sm font-medium">
                  Deterministic evaluation
                </p>

                <p className="mt-1 text-xs text-zinc-500">
                  Prefer observable rule-based checks whenever possible.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 rounded-lg border p-4">
              <input
                type="checkbox"
                checked={semantic}
                onChange={(e) => setSemantic(e.target.checked)}
                className="mt-1 h-4 w-4"
              />

              <div>
                <p className="text-sm font-medium">
                  Semantic evaluation
                </p>

                <p className="mt-1 text-xs text-zinc-500">
                  Use semantic judgment for behavior that cannot be verified
                  deterministically.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 rounded-lg border p-4">
              <input
                type="checkbox"
                checked={storeTraces}
                onChange={(e) => setStoreTraces(e.target.checked)}
                className="mt-1 h-4 w-4"
              />

              <div>
                <p className="text-sm font-medium">
                  Store execution traces
                </p>

                <p className="mt-1 text-xs text-zinc-500">
                  Keep traces available for debugging, evidence, and replay.
                </p>
              </div>
            </label>
          </div>
        </section>

        <div className="flex justify-end">
          <button
            type="submit"
            className="rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}