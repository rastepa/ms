"use client";

import { useEffect, useState } from "react";
import { CheckSquare, FolderOpen, Users, Clock, TrendingUp } from "lucide-react";
import type { Task, Agent, Project } from "@/lib/db";
import { TaskStatusBadge, PriorityBadge, AgentStatusDot } from "@/components/StatusBadge";
import Link from "next/link";

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/tasks").then((r) => r.json()),
      fetch("/api/agents").then((r) => r.json()),
      fetch("/api/projects").then((r) => r.json()),
    ]).then(([t, a, p]) => {
      setTasks(t);
      setAgents(a);
      setProjects(p);
      setLoading(false);
    });

    const es = new EventSource("/api/stream");
    const reload = () =>
      Promise.all([
        fetch("/api/tasks").then((r) => r.json()),
        fetch("/api/agents").then((r) => r.json()),
      ]).then(([t, a]) => { setTasks(t); setAgents(a); });
    es.addEventListener("task_created", reload);
    es.addEventListener("task_updated", reload);
    es.addEventListener("agent_updated", reload);
    es.addEventListener("paul_sync", reload);
    return () => es.close();
  }, []);

  const pending = tasks.filter((t) => t.status === "pending");
  const inProgress = tasks.filter((t) => t.status === "in_progress");
  const recentDone = tasks.filter((t) => t.status === "done").slice(0, 5);

  const stats = [
    { label: "Needs Approval", value: pending.length, icon: Clock, color: "text-yellow-400", href: "/tasks" },
    { label: "In Progress", value: inProgress.length, icon: TrendingUp, color: "text-violet-400", href: "/tasks" },
    { label: "Active Projects", value: projects.filter((p) => p.status === "active").length, icon: FolderOpen, color: "text-blue-400", href: "/projects" },
    { label: "Total Tasks", value: tasks.length, icon: CheckSquare, color: "text-green-400", href: "/tasks" },
  ];

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">Loading…</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Mission Control System — NanoClaw operations centre</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, href }) => (
          <Link key={label} href={href} className="bg-[#111111] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-500 uppercase tracking-widest">{label}</span>
              <Icon size={14} className={color} />
            </div>
            <p className="text-3xl font-bold text-white">{value}</p>
          </Link>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-[#111111] border border-white/5 rounded-xl p-5">
          <h2 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
            <Clock size={14} className="text-yellow-400" />
            Needs Approval
            {pending.length > 0 && (
              <span className="ml-auto bg-yellow-500/15 text-yellow-400 text-[11px] px-2 py-0.5 rounded-full">{pending.length}</span>
            )}
          </h2>
          {pending.length === 0 ? (
            <p className="text-gray-600 text-sm">All caught up.</p>
          ) : (
            <div className="space-y-3">
              {pending.slice(0, 5).map((t) => (
                <Link key={t.id} href={`/tasks/${t.id}`} className="flex items-start gap-3 hover:opacity-80 transition-opacity">
                  <PriorityBadge priority={t.priority} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-200 truncate">{t.title}</p>
                    {t.due_date && <p className="text-[11px] text-gray-500 mt-0.5">{t.due_date.slice(0, 10)}</p>}
                  </div>
                </Link>
              ))}
              {pending.length > 5 && (
                <Link href="/tasks" className="text-xs text-violet-400 hover:text-violet-300">
                  View all {pending.length} →
                </Link>
              )}
            </div>
          )}
        </div>

        <div className="bg-[#111111] border border-white/5 rounded-xl p-5">
          <h2 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
            <Users size={14} className="text-blue-400" />
            Agents
          </h2>
          <div className="space-y-3">
            {agents.map((a) => {
              const activeTasks = inProgress.filter((t) => t.agent_id === a.id);
              return (
                <div key={a.id} className="flex items-center gap-3">
                  <AgentStatusDot status={a.status} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-200">{a.name} <span className="text-gray-600 text-xs">({a.role})</span></p>
                    <p className="text-[11px] text-gray-500">{a.model.replace("claude-", "")}</p>
                  </div>
                  {activeTasks.length > 0 && (
                    <span className="text-[11px] text-violet-400">{activeTasks.length} active</span>
                  )}
                </div>
              );
            })}
          </div>
          <Link href="/team" className="text-xs text-violet-400 hover:text-violet-300 mt-4 block">
            View team →
          </Link>
        </div>
      </div>

      {recentDone.length > 0 && (
        <div className="bg-[#111111] border border-white/5 rounded-xl p-5">
          <h2 className="text-sm font-medium text-white mb-4">Recent Completions</h2>
          <div className="space-y-2">
            {recentDone.map((t) => (
              <Link key={t.id} href={`/tasks/${t.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <TaskStatusBadge status="done" />
                <span className="text-sm text-gray-300 flex-1 truncate">{t.title}</span>
                <span className="text-[11px] text-gray-600">{t.completed_at?.slice(0, 10) ?? ""}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
