"use client";

import { useEffect, useState, useCallback } from "react";
import type { Task } from "@/lib/db";

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch_ = useCallback(async () => {
    const res = await fetch("/api/tasks");
    setTasks(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch_();
    const es = new EventSource("/api/stream");
    const refresh = () => fetch_();
    es.addEventListener("task_created", refresh);
    es.addEventListener("task_updated", refresh);
    es.addEventListener("task_deleted", refresh);
    return () => es.close();
  }, [fetch_]);

  async function updateStatus(id: string, status: Task["status"]) {
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetch_();
  }

  async function createTask(data: Partial<Task> & { title: string }) {
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json() as Promise<Task>;
  }

  async function deleteTask(id: string) {
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    fetch_();
  }

  return { tasks, loading, updateStatus, createTask, deleteTask, refetch: fetch_ };
}
