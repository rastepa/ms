"use client";

import { useEffect, useState } from "react";
import type { Agent, Task } from "@/lib/db";
import { AgentStatusDot, TaskStatusBadge } from "@/components/StatusBadge";
import { Cpu } from "lucide-react";

export default function TeamPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/agents").then((r) => r.json()),
      fetch("/api/tasks").then((r) => r.json()),
    ]).then(([a, t]) => { setAgents(a); setTasks(t); setLoading(false); });

    const es = new EventSource("/api/stream");
    const reload = () =>
      Promise.all([fetch("/api/agents").then((r) => r.json()), fetch("/api/tasks").then((r) => r.json())])
        .then(([a, t]) => { setAgents(a); setTasks(t); });
    es.addEventListener("agent_updated", reload);
    es.addEventListener("task_updated", reload);
    es.addEventListener("paul_sync", reload);
    return () => es.close();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">Loading…</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Agents</h1>
        <p className="text-gray-500 text-sm mt-1">AI team — model routing enforced per agent</p>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {agents.map((a) => {
          const agentTasks = tasks.filter((t) => t.agent_id === a.id);
          const caps: string[] = JSON.parse(a.capabilities);
          const statusCounts = { pending: 0, approved: 0, in_progress: 0, done: 0, rejected: 0 };
          for (const t of agentTasks) statusCounts[t.status as keyof typeof statusCounts]++;

          return (
            <div key={a.id} className="bg-[#111111] border border-white/5 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-violet-600/20 flex items-center justify-center border border-violet-500/20">
                  <Cpu size={16} className="text-violet-400" />
                </div>
                <div>
                  <p className="font-semibold text-white">{a.name}</p>
                  <p className="text-xs text-gray-500">{a.role}</p>
                </div>
                <AgentStatusDot status={a.status} />
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Model</span>
                  <span className="text-gray-300 font-mono text-[11px]">{a.model.replace("claude-", "")}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Status</span>
                  <span className="capitalize text-gray-300">{a.status}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Tasks total</span>
                  <span className="text-gray-300">{agentTasks.length}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">In progress</span>
                  <span className="text-violet-400">{statusCounts.in_progress}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Done</span>
                  <span className="text-green-400">{statusCounts.done}</span>
                </div>
              </div>

              {a.description && <p className="text-xs text-gray-500 mb-4">{a.description}</p>}

              <div className="flex flex-wrap gap-1">
                {caps.map((c) => (
                  <span key={c} className="text-[10px] bg-white/5 text-gray-400 px-2 py-0.5 rounded-full">{c}</span>
                ))}
              </div>

              {statusCounts.in_progress > 0 && (
                <div className="mt-4 border-t border-white/5 pt-3">
                  <p className="text-[11px] text-gray-500 mb-2">Active</p>
                  {tasks.filter((t) => t.agent_id === a.id && t.status === "in_progress").map((t) => (
                    <p key={t.id} className="text-xs text-violet-300 truncate">{t.title}</p>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
