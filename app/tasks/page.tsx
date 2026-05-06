"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useTasks } from "@/hooks/useTasks";
import { TaskStatusBadge, PriorityBadge } from "@/components/StatusBadge";
import ApprovalActions from "@/components/ApprovalActions";
import Link from "next/link";
import type { TaskStatus, Priority } from "@/lib/db";

const STATUS_ORDER: TaskStatus[] = ["pending", "approved", "in_progress", "done", "rejected"];

export default function TasksPage() {
  const { tasks, loading, createTask, deleteTask, refetch } = useTasks();
  const [filter, setFilter] = useState<TaskStatus | "all">("all");
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", priority: "medium" as Priority, due_date: "" });

  const visible = filter === "all" ? tasks : tasks.filter((t) => t.status === filter);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    await createTask({ ...form, status: "pending" });
    setForm({ title: "", description: "", priority: "medium", due_date: "" });
    setShowNew(false);
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">Loading…</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Tasks</h1>
          <p className="text-gray-500 text-sm mt-1">Approval-gated workflow</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus size={15} />
          New Task
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-[#111111] border border-white/5 rounded-lg p-1 w-fit">
        {(["all", ...STATUS_ORDER] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize ${
              filter === s ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {s === "all" ? "All" : s.replace("_", " ")}
            {s !== "all" && (
              <span className="ml-1.5 text-gray-600">
                {tasks.filter((t) => t.status === s).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* New task form */}
      {showNew && (
        <div className="bg-[#111111] border border-violet-500/30 rounded-xl p-5">
          <h3 className="text-sm font-medium text-white mb-4">New Task</h3>
          <form onSubmit={handleCreate} className="space-y-3">
            <input
              placeholder="Task title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50"
              required
            />
            <textarea
              placeholder="Description (optional)"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 resize-none"
            />
            <div className="flex gap-3">
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
              <input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors">
                Create
              </button>
              <button type="button" onClick={() => setShowNew(false)} className="px-4 py-2 text-gray-400 hover:text-gray-200 text-sm transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Task list */}
      <div className="space-y-2">
        {visible.length === 0 && <p className="text-gray-600 text-sm py-8 text-center">No tasks.</p>}
        {visible.map((t) => (
          <div key={t.id} className="bg-[#111111] border border-white/5 rounded-xl px-5 py-4 hover:border-white/10 transition-colors">
            <div className="flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link href={`/tasks/${t.id}`} className="text-sm font-medium text-white hover:text-violet-300 transition-colors">
                    {t.title}
                  </Link>
                  <TaskStatusBadge status={t.status} />
                  <PriorityBadge priority={t.priority} />
                  {t.source === "agent" && (
                    <span className="text-[11px] text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full">⚡ agent</span>
                  )}
                </div>
                {t.description && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-1">{t.description}</p>
                )}
                <div className="flex items-center gap-4 mt-2">
                  {t.due_date && <span className="text-[11px] text-gray-500">{t.due_date.slice(0, 10)}</span>}
                  <span className="text-[11px] text-gray-600">{t.created_at.slice(0, 10)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <ApprovalActions taskId={t.id} status={t.status} onUpdated={refetch} />
                <button
                  onClick={() => deleteTask(t.id)}
                  className="text-gray-600 hover:text-red-400 transition-colors p-1"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
