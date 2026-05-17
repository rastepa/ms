"use client";

import { use, useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { TaskStatusBadge, PriorityBadge } from "@/components/StatusBadge";
import type { Project, Task } from "@/lib/db";

const statusColors: Record<string, string> = {
  active: "bg-green-500/15 text-green-400",
  paused: "bg-yellow-500/15 text-yellow-400",
  completed: "bg-blue-500/15 text-blue-400",
  archived: "bg-gray-500/15 text-gray-400",
};

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/projects").then((r) => r.json()),
      fetch("/api/tasks").then((r) => r.json()),
    ]).then(([projects, allTasks]: [Project[], Task[]]) => {
      setProject(projects.find((p) => p.id === id) ?? null);
      setTasks(allTasks.filter((t) => t.project_id === id));
      setLoading(false);
    });
  }, [id]);

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">Loading…</div>;
  if (!project) return <div className="flex items-center justify-center h-64 text-gray-500">Project not found.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Link href="/projects" className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors mb-4">
          <ArrowLeft size={13} />
          Projects
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">{project.name}</h1>
            {project.description && <p className="text-gray-500 text-sm mt-1">{project.description}</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0 pt-1">
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full capitalize ${statusColors[project.status]}`}>{project.status}</span>
            <PriorityBadge priority={project.priority} />
          </div>
        </div>
        {project.due_date && (
          <p className="text-[11px] text-gray-600 mt-2">Due: {project.due_date.slice(0, 10)}</p>
        )}
      </div>

      <div>
        <h2 className="text-sm font-medium text-gray-400 mb-3">
          Tasks <span className="text-gray-600 font-normal ml-1">{tasks.length}</span>
        </h2>
        <div className="space-y-2">
          {tasks.length === 0 && (
            <p className="text-gray-600 text-sm py-8 text-center">No tasks assigned to this project.</p>
          )}
          {tasks.map((t) => (
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
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{t.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2">
                    {t.due_date && <span className="text-[11px] text-gray-500">{t.due_date.slice(0, 10)}</span>}
                    <span className="text-[11px] text-gray-600">{t.created_at.slice(0, 10)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
