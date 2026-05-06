import { cn } from "@/lib/utils";
import type { TaskStatus, Priority, AgentStatus, ProjectStatus } from "@/lib/db";

const taskStatusStyles: Record<TaskStatus, string> = {
  pending: "bg-yellow-500/15 text-yellow-400 border border-yellow-500/20",
  approved: "bg-blue-500/15 text-blue-400 border border-blue-500/20",
  in_progress: "bg-violet-500/15 text-violet-400 border border-violet-500/20",
  done: "bg-green-500/15 text-green-400 border border-green-500/20",
  rejected: "bg-red-500/15 text-red-400 border border-red-500/20",
};

const taskStatusLabels: Record<TaskStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  in_progress: "In Progress",
  done: "Done",
  rejected: "Rejected",
};

const priorityStyles: Record<Priority, string> = {
  low: "bg-gray-500/15 text-gray-400",
  medium: "bg-blue-500/15 text-blue-400",
  high: "bg-orange-500/15 text-orange-400",
  critical: "bg-red-500/15 text-red-400",
};

const agentStatusStyles: Record<AgentStatus, string> = {
  idle: "bg-gray-500/15 text-gray-400",
  working: "bg-violet-500/15 text-violet-400",
  offline: "bg-red-500/15 text-red-400",
};

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full", taskStatusStyles[status])}>
      {taskStatusLabels[status]}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full capitalize", priorityStyles[priority])}>
      {priority}
    </span>
  );
}

export function AgentStatusDot({ status }: { status: AgentStatus }) {
  const colors: Record<AgentStatus, string> = {
    idle: "bg-gray-500",
    working: "bg-violet-400 animate-pulse",
    offline: "bg-red-500",
  };
  return <span className={cn("inline-block w-2 h-2 rounded-full", colors[status])} />;
}
