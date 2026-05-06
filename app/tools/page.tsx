"use client";

import { useEffect, useState } from "react";
import type { Tool } from "@/lib/db";
import { Wrench, ExternalLink } from "lucide-react";

const categoryColors: Record<string, string> = {
  Development: "bg-blue-500/15 text-blue-400",
  Research: "bg-green-500/15 text-green-400",
  Integration: "bg-violet-500/15 text-violet-400",
  default: "bg-gray-500/15 text-gray-400",
};

const statusColors: Record<string, string> = {
  active: "bg-green-500/15 text-green-400",
  inactive: "bg-gray-500/15 text-gray-400",
  deprecated: "bg-red-500/15 text-red-400",
};

export default function ToolsPage() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => fetch("/api/tools").then((r) => r.json()).then((t) => { setTools(t); setLoading(false); });

  useEffect(() => { load(); }, []);

  async function toggleStatus(tool: Tool) {
    const status = tool.status === "active" ? "inactive" : "active";
    await fetch(`/api/tools/${tool.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  const grouped: Record<string, Tool[]> = {};
  for (const t of tools) {
    const cat = t.category ?? "Other";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(t);
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">Loading…</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Tools Hub</h1>
        <p className="text-gray-500 text-sm mt-1">Integrations and capabilities available to agents</p>
      </div>

      {Object.entries(grouped).map(([category, catTools]) => (
        <div key={category}>
          <h2 className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-3">{category}</h2>
          <div className="grid md:grid-cols-2 gap-3">
            {catTools.map((t) => (
              <div key={t.id} className="bg-[#111111] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                      <Wrench size={14} className="text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{t.name}</p>
                      {t.description && <p className="text-xs text-gray-500 mt-0.5">{t.description}</p>}
                    </div>
                  </div>
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 ${statusColors[t.status]}`}>
                    {t.status}
                  </span>
                </div>

                <div className="flex items-center gap-3 mt-3">
                  {t.category && (
                    <span className={`text-[11px] px-2 py-0.5 rounded-full ${categoryColors[t.category] ?? categoryColors.default}`}>
                      {t.category}
                    </span>
                  )}
                  {t.endpoint && (
                    <span className="text-[11px] text-gray-600 font-mono flex items-center gap-1">
                      <ExternalLink size={10} />
                      {t.endpoint}
                    </span>
                  )}
                  <button
                    onClick={() => toggleStatus(t)}
                    className="ml-auto text-[11px] text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {t.status === "active" ? "Disable" : "Enable"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
