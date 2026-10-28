"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { deleteAgent } from "../api";

type AgentActionsProps = {
  agentId: string;
  onDeleted?: () => void;
};

export function AgentActions({
  agentId,
  onDeleted,
}: AgentActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(
      "Are you sure you want to delete this agent?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);

      await deleteAgent(agentId);

      onDeleted?.();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <Button
        type="button"
        variant="outline"
        disabled={loading}
        onClick={() => router.push(`/agents/${agentId}/settings`)}
      >
        Edit Agent
      </Button>

      <Button
        type="button"
        variant="danger"
        onClick={handleDelete}
        disabled={loading}
      >
        {loading ? "Deleting..." : "Delete Agent"}
      </Button>
    </div>
  );
}