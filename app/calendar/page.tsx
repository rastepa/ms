"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Task } from "@/lib/db";
import { PriorityBadge } from "@/components/StatusBadge";

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function CalendarPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    fetch("/api/tasks").then((r) => r.json()).then(setTasks);
  }, []);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const monthName = new Date(year, month, 1).toLocaleString("default", { month: "long" });

  function prev() {
    if (month === 0) { setYear(year - 1); setMonth(11); }
    else setMonth(month - 1);
  }
  function next() {
    if (month === 11) { setYear(year + 1); setMonth(0); }
    else setMonth(month + 1);
  }

  function tasksForDay(day: number): Task[] {
    const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return tasks.filter((t) => t.due_date?.startsWith(iso));
  }

  const noDue = tasks.filter((t) => !t.due_date);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Calendar</h1>
          <p className="text-gray-500 text-sm mt-1">Tasks by due date</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={prev} className="text-gray-400 hover:text-white transition-colors p-1">
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-medium text-white w-36 text-center">{monthName} {year}</span>
          <button onClick={next} className="text-gray-400 hover:text-white transition-colors p-1">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="bg-[#111111] border border-white/5 rounded-xl overflow-hidden">
        <div className="grid grid-cols-7 border-b border-white/5">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="py-2 text-center text-xs text-gray-500 font-medium">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`e-${i}`} className="border-b border-r border-white/5 min-h-16" />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
            const dayTasks = tasksForDay(day);
            const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
            return (
              <div
                key={day}
                className={`border-b border-r border-white/5 min-h-16 p-1.5 ${isToday ? "bg-violet-500/5" : ""}`}
              >
                <span className={`text-xs font-medium ${isToday ? "text-violet-400" : "text-gray-400"}`}>{day}</span>
                <div className="mt-1 space-y-0.5">
                  {dayTasks.slice(0, 2).map((t) => (
                    <div key={t.id} className="text-[10px] text-gray-300 bg-white/5 rounded px-1 py-0.5 truncate">
                      {t.title}
                    </div>
                  ))}
                  {dayTasks.length > 2 && (
                    <div className="text-[10px] text-gray-500">+{dayTasks.length - 2} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* No due date */}
      {noDue.length > 0 && (
        <div className="bg-[#111111] border border-white/5 rounded-xl p-5">
          <h2 className="text-sm font-medium text-white mb-3 text-gray-500">No Due Date ({noDue.length})</h2>
          <div className="space-y-2">
            {noDue.map((t) => (
              <div key={t.id} className="flex items-center gap-3">
                <PriorityBadge priority={t.priority} />
                <span className="text-sm text-gray-300 flex-1 truncate">{t.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
