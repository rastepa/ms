"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import type { Task, Agent } from "@/lib/db";
import { TaskStatusBadge, PriorityBadge } from "@/components/StatusBadge";
import ApprovalActions from "@/components/ApprovalActions";

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [task, setTask] = useState<Task | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = () =>
    fetch(`/api/tasks/${id}`).then((r) => r.json()).then((t) => { setTask(t); setLoading(false); });

  useEffect(() => {
    reload();
    fetch("/api/agents").then((r) => r.json()).then(setAgents);
  }, [id]);

  async function handleDelete() {
    if (!confirm("Delete this task?")) return;
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    router.push("/tasks");
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">Loading…</div>;
  if (!task) return <div className="flex items-center justify-center h-64 text-gray-500">Task not found.</div>;

  const agent = agents.find((a) => a.id === task.agent_id);
  const policy = task.policy ? JSON.parse(task.policy) : null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-300 transition-colors">
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-xl font-bold text-white flex-1 truncate">{task.title}</h1>
        <button onClick={handleDelete} className="text-gray-600 hover:text-red-400 transition-colors">
          <Trash2 size={16} />
        </button>
      </div>

      <div className="bg-[#111111] border border-white/5 rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-2 flex-wrap">
          <TaskStatusBadge status={task.status} />
          <PriorityBadge priority={task.priority} />
          {task.source === "agent" && (
            <span className="text-[11px] text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full">⚡ agent-created</span>
          )}
        </div>

        {task.description && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Description</p>
            <p className="text-sm text-gray-300 whitespace-pre-wrap">{task.description}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Assigned To</p>
            <p className="text-gray-300">{agent?.name ?? "Unassigned"}</p>
          </div>
          {task.due_date && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Due Date</p>
              <p className="text-gray-300">{task.due_date.slice(0, 10)}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Created</p>
            <p className="text-gray-300">{task.created_at.slice(0, 16).replace("T", " ")}</p>
          </div>
          {task.approved_at && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Approved</p>
              <p className="text-gray-300">{task.approved_at.slice(0, 16).replace("T", " ")}</p>
            </div>
          )}
          {task.started_at && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Started</p>
              <p className="text-gray-300">{task.started_at.slice(0, 16).replace("T", " ")}</p>
            </div>
          )}
          {task.completed_at && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Completed</p>
              <p className="text-gray-300">{task.completed_at.slice(0, 16).replace("T", " ")}</p>
            </div>
          )}
        </div>

        {policy && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Execution Policy</p>
            <pre className="bg-black/30 rounded-lg p-3 text-xs text-gray-400 overflow-auto">
              {JSON.stringify(policy, null, 2)}
            </pre>
          </div>
        )}

        {task.output && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Agent Output</p>
            <div className="bg-black/30 rounded-lg p-3 text-sm text-gray-300 whitespace-pre-wrap">
              {task.output}
            </div>
          </div>
        )}

        <div className="pt-2">
          <ApprovalActions taskId={task.id} status={task.status} onUpdated={reload} />
        </div>
      </div>
    </div>
  );
}
