"use client";

import { useState } from "react";
import { Check, X, Play } from "lucide-react";
import type { TaskStatus } from "@/lib/db";

interface Props {
  taskId: string;
  status: TaskStatus;
  onUpdated: () => void;
}

export default function ApprovalActions({ taskId, status, onUpdated }: Props) {
  const [loading, setLoading] = useState(false);

  async function patch(data: object) {
    setLoading(true);
    await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setLoading(false);
    onUpdated();
  }

  if (status === "pending") {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => patch({ status: "approved" })}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-green-600 hover:bg-green-500 text-white text-xs font-medium transition-colors disabled:opacity-50"
        >
          <Check size={12} />
          Approve
        </button>
        <button
          onClick={() => patch({ status: "rejected" })}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-500 text-white text-xs font-medium transition-colors disabled:opacity-50"
        >
          <X size={12} />
          Reject
        </button>
      </div>
    );
  }

  if (status === "approved") {
    return (
      <button
        onClick={() => patch({ status: "in_progress" })}
        disabled={loading}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-colors disabled:opacity-50"
      >
        <Play size={12} />
        Start
      </button>
    );
  }

  if (status === "in_progress") {
    return (
      <button
        onClick={() => patch({ status: "done" })}
        disabled={loading}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-green-700 hover:bg-green-600 text-white text-xs font-medium transition-colors disabled:opacity-50"
      >
        <Check size={12} />
        Mark Done
      </button>
    );
  }

  return null;
}
