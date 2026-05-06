"use client";

import { useEffect, useState, useCallback } from "react";
import type { Agent } from "@/lib/db";

export function useAgents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch_ = useCallback(async () => {
    const res = await fetch("/api/agents");
    setAgents(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch_();
    const es = new EventSource("/api/stream");
    es.addEventListener("agent_updated", () => fetch_());
    es.addEventListener("paul_sync", () => fetch_());
    return () => es.close();
  }, [fetch_]);

  return { agents, loading, refetch: fetch_ };
}
