import Database from "better-sqlite3";
import path from "path";
import { newId, now } from "./utils";
import { AGENT_MODEL_MAP, type AgentName } from "./policy";

const DB_PATH = path.join(process.cwd(), "ms.db");

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma("journal_mode = WAL");
    _db.pragma("foreign_keys = ON");
    init(_db);
  }
  return _db;
}

function init(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL,
      model TEXT NOT NULL,
      status TEXT DEFAULT 'idle',
      description TEXT,
      capabilities TEXT DEFAULT '[]',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'active',
      priority TEXT DEFAULT 'medium',
      lead_agent_id TEXT,
      due_date TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'pending',
      priority TEXT DEFAULT 'medium',
      agent_id TEXT,
      project_id TEXT,
      due_date TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      approved_at TEXT,
      started_at TEXT,
      completed_at TEXT,
      policy TEXT,
      output TEXT,
      source TEXT DEFAULT 'manual'
    );

    CREATE TABLE IF NOT EXISTS tools (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT,
      status TEXT DEFAULT 'active',
      endpoint TEXT,
      config TEXT DEFAULT '{}',
      created_at TEXT NOT NULL
    );
  `);

  // Seed agents if not present
  const agentCount = (db.prepare("SELECT COUNT(*) as c FROM agents").get() as { c: number }).c;
  if (agentCount === 0) {
    const insert = db.prepare(`
      INSERT INTO agents (id, name, role, model, status, description, capabilities, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const agents: Array<{ name: AgentName; role: string; description: string; capabilities: string[] }> = [
      {
        name: "John",
        role: "Coder",
        description: "Senior engineer. Handles implementation, architecture, and code review.",
        capabilities: ["TypeScript", "Python", "System Design", "Code Review", "Debugging"],
      },
      {
        name: "Ringo",
        role: "Researcher",
        description: "Research specialist. Gathers intelligence, analyses options, and produces reports.",
        capabilities: ["Web Research", "Market Analysis", "Competitive Intelligence", "Summarization"],
      },
      {
        name: "Paul",
        role: "Librarian",
        description: "Knowledge curator. Runs hourly syncs, maintains documentation, and organises project state.",
        capabilities: ["Documentation", "State Sync", "Knowledge Management", "Reporting"],
      },
    ];
    for (const a of agents) {
      insert.run(newId(), a.name, a.role, AGENT_MODEL_MAP[a.name], "idle", a.description, JSON.stringify(a.capabilities), now());
    }
  }

  // Seed demo tools if not present
  const toolCount = (db.prepare("SELECT COUNT(*) as c FROM tools").get() as { c: number }).c;
  if (toolCount === 0) {
    const insert = db.prepare(`
      INSERT INTO tools (id, name, description, category, status, endpoint, config, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const tools = [
      { name: "GitHub", description: "Code repository and version control", category: "Development", endpoint: "https://api.github.com", config: {} },
      { name: "Web Search", description: "Real-time web search for research tasks", category: "Research", endpoint: "/api/tools/search", config: {} },
      { name: "NanoClaw Webhook", description: "Inbound webhook from NanoClaw agent", category: "Integration", endpoint: "/api/webhook", config: {} },
      { name: "SSE Stream", description: "Server-sent events for real-time dashboard updates", category: "Integration", endpoint: "/api/stream", config: {} },
    ];
    for (const t of tools) {
      insert.run(newId(), t.name, t.description, t.category, "active", t.endpoint, JSON.stringify(t.config), now());
    }
  }
}

// ─── Types ───────────────────────────────────────────────────────────────────

export type TaskStatus = "pending" | "approved" | "in_progress" | "done" | "rejected";
export type Priority = "low" | "medium" | "high" | "critical";
export type AgentStatus = "idle" | "working" | "offline";
export type ProjectStatus = "active" | "paused" | "completed" | "archived";
export type ToolStatus = "active" | "inactive" | "deprecated";

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  agent_id: string | null;
  project_id: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  policy: string | null;
  output: string | null;
  source: string;
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  model: string;
  status: AgentStatus;
  description: string | null;
  capabilities: string;
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  priority: Priority;
  lead_agent_id: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Tool {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  status: ToolStatus;
  endpoint: string | null;
  config: string;
  created_at: string;
}

// ─── Task queries ─────────────────────────────────────────────────────────────

export function getAllTasks(): Task[] {
  return getDb().prepare("SELECT * FROM tasks ORDER BY updated_at DESC").all() as Task[];
}

export function getTaskById(id: string): Task | null {
  return (getDb().prepare("SELECT * FROM tasks WHERE id = ?").get(id) as Task) ?? null;
}

export function createTask(data: Partial<Task> & { title: string }): Task {
  const db = getDb();
  const id = newId();
  const ts = now();
  db.prepare(`
    INSERT INTO tasks (id, title, description, status, priority, agent_id, project_id, due_date, created_at, updated_at, policy, source)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, data.title, data.description ?? null,
    data.status ?? "pending", data.priority ?? "medium",
    data.agent_id ?? null, data.project_id ?? null,
    data.due_date ?? null, ts, ts,
    data.policy ?? null, data.source ?? "manual"
  );
  return getTaskById(id)!;
}

export function updateTask(id: string, data: Partial<Task>): Task | null {
  const existing = getTaskById(id);
  if (!existing) return null;
  const ts = now();
  const merged = { ...existing, ...data, updated_at: ts };
  getDb().prepare(`
    UPDATE tasks SET
      title=?, description=?, status=?, priority=?, agent_id=?, project_id=?,
      due_date=?, updated_at=?, approved_at=?, started_at=?, completed_at=?,
      policy=?, output=?, source=?
    WHERE id=?
  `).run(
    merged.title, merged.description, merged.status, merged.priority,
    merged.agent_id, merged.project_id, merged.due_date, merged.updated_at,
    merged.approved_at, merged.started_at, merged.completed_at,
    merged.policy, merged.output, merged.source, id
  );
  return getTaskById(id);
}

export function deleteTask(id: string): boolean {
  const result = getDb().prepare("DELETE FROM tasks WHERE id = ?").run(id);
  return result.changes > 0;
}

// ─── Agent queries ────────────────────────────────────────────────────────────

export function getAllAgents(): Agent[] {
  return getDb().prepare("SELECT * FROM agents ORDER BY name").all() as Agent[];
}

export function getAgentById(id: string): Agent | null {
  return (getDb().prepare("SELECT * FROM agents WHERE id = ?").get(id) as Agent) ?? null;
}

export function getAgentByName(name: string): Agent | null {
  return (getDb().prepare("SELECT * FROM agents WHERE name = ?").get(name) as Agent) ?? null;
}

export function updateAgentStatus(id: string, status: AgentStatus): void {
  getDb().prepare("UPDATE agents SET status=? WHERE id=?").run(status, id);
}

// ─── Project queries ──────────────────────────────────────────────────────────

export function getAllProjects(): Project[] {
  return getDb().prepare("SELECT * FROM projects ORDER BY updated_at DESC").all() as Project[];
}

export function getProjectById(id: string): Project | null {
  return (getDb().prepare("SELECT * FROM projects WHERE id = ?").get(id) as Project) ?? null;
}

export function createProject(data: Partial<Project> & { name: string }): Project {
  const db = getDb();
  const id = newId();
  const ts = now();
  db.prepare(`
    INSERT INTO projects (id, name, description, status, priority, lead_agent_id, due_date, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, data.name, data.description ?? null, data.status ?? "active", data.priority ?? "medium", data.lead_agent_id ?? null, data.due_date ?? null, ts, ts);
  return getProjectById(id)!;
}

export function updateProject(id: string, data: Partial<Project>): Project | null {
  const existing = getProjectById(id);
  if (!existing) return null;
  const merged = { ...existing, ...data, updated_at: now() };
  getDb().prepare(`
    UPDATE projects SET name=?, description=?, status=?, priority=?, lead_agent_id=?, due_date=?, updated_at=?
    WHERE id=?
  `).run(merged.name, merged.description, merged.status, merged.priority, merged.lead_agent_id, merged.due_date, merged.updated_at, id);
  return getProjectById(id);
}

export function deleteProject(id: string): boolean {
  const result = getDb().prepare("DELETE FROM projects WHERE id = ?").run(id);
  return result.changes > 0;
}

// ─── Tool queries ─────────────────────────────────────────────────────────────

export function getAllTools(): Tool[] {
  return getDb().prepare("SELECT * FROM tools ORDER BY category, name").all() as Tool[];
}

export function getToolById(id: string): Tool | null {
  return (getDb().prepare("SELECT * FROM tools WHERE id = ?").get(id) as Tool) ?? null;
}

export function updateTool(id: string, data: Partial<Tool>): Tool | null {
  const existing = getToolById(id);
  if (!existing) return null;
  const merged = { ...existing, ...data };
  getDb().prepare(`
    UPDATE tools SET name=?, description=?, category=?, status=?, endpoint=?, config=?
    WHERE id=?
  `).run(merged.name, merged.description, merged.category, merged.status, merged.endpoint, merged.config, id);
  return getToolById(id);
}
