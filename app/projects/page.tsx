"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { Project, Agent } from "@/lib/db";

const statusColors: Record<string, string> = {
  active: "bg-green-500/15 text-green-400",
  paused: "bg-yellow-500/15 text-yellow-400",
  completed: "bg-blue-500/15 text-blue-400",
  archived: "bg-gray-500/15 text-gray-400",
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", priority: "medium", lead_agent_id: "", due_date: "" });

  const load = () =>
    Promise.all([
      fetch("/api/projects").then((r) => r.json()),
      fetch("/api/agents").then((r) => r.json()),
    ]).then(([p, a]) => { setProjects(p); setAgents(a); setLoading(false); });

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, lead_agent_id: form.lead_agent_id || null }),
    });
    setForm({ name: "", description: "", priority: "medium", lead_agent_id: "", due_date: "" });
    setShowNew(false);
    load();
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  async function deleteProject(id: string) {
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    load();
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">Loading…</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Projects</h1>
          <p className="text-gray-500 text-sm mt-1">{projects.filter((p) => p.status === "active").length} active</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus size={15} />
          New Project
        </button>
      </div>

      {showNew && (
        <div className="bg-[#111111] border border-violet-500/30 rounded-xl p-5">
          <h3 className="text-sm font-medium text-white mb-4">New Project</h3>
          <form onSubmit={handleCreate} className="space-y-3">
            <input
              placeholder="Project name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
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
            <div className="flex gap-3 flex-wrap">
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
              <select
                value={form.lead_agent_id}
                onChange={(e) => setForm({ ...form, lead_agent_id: e.target.value })}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
              >
                <option value="">No lead agent</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
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

      <div className="space-y-3">
        {projects.length === 0 && <p className="text-gray-600 text-sm py-8 text-center">No projects yet.</p>}
        {projects.map((p) => {
          const lead = agents.find((a) => a.id === p.lead_agent_id);
          return (
            <div key={p.id} className="bg-[#111111] border border-white/5 rounded-xl px-5 py-4 hover:border-white/10 transition-colors">
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-white">{p.name}</p>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full capitalize ${statusColors[p.status]}`}>{p.status}</span>
                    <span className="text-[11px] text-gray-500 capitalize">{p.priority}</span>
                  </div>
                  {p.description && <p className="text-xs text-gray-500 mt-1 line-clamp-1">{p.description}</p>}
                  <div className="flex items-center gap-4 mt-2 text-[11px] text-gray-500">
                    {lead && <span>Lead: {lead.name}</span>}
                    {p.due_date && <span>Due: {p.due_date.slice(0, 10)}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={p.status}
                    onChange={(e) => updateStatus(p.id, e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-md px-2 py-1 text-xs text-gray-300 focus:outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                  </select>
                  <button onClick={() => deleteProject(p.id)} className="text-gray-600 hover:text-red-400 transition-colors p-1">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
