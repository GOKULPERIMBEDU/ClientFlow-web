import { statusLabel, TASK_COLUMNS, type Task, type TaskActivity, type TaskStatus } from "@/types/domain";

export function formatDuration(ms: number): string {
  const safe = Math.max(0, ms);
  const minutes = Math.floor(safe / 60_000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    const remainderHours = hours % 24;
    return remainderHours ? `${days}d ${remainderHours}h` : `${days}d`;
  }
  if (hours > 0) {
    const remainderMinutes = minutes % 60;
    return remainderMinutes ? `${hours}h ${remainderMinutes}m` : `${hours}h`;
  }
  if (minutes < 1) {
    return "<1m";
  }
  return `${minutes}m`;
}

function matchesStatus(value: string, status: TaskStatus): boolean {
  const normalized = value.trim().toLowerCase();
  return normalized === status || normalized === statusLabel(status).toLowerCase();
}

function historyEntries(task: Task): TaskActivity[] {
  return (task.activityLog ?? task.activity ?? []).slice().sort((a, b) => {
    const left = a.timestamp || a.createdAt;
    const right = b.timestamp || b.createdAt;
    return left.localeCompare(right);
  });
}

export function historyLog(task: Task): TaskActivity[] {
  return historyEntries(task).filter(
    (entry) => entry.actionType !== "comment" && entry.type !== "comment" && entry.actionType !== "worklog" && entry.type !== "worklog",
  );
}

export function workLog(task: Task): TaskActivity[] {
  return historyEntries(task).filter((entry) => entry.actionType === "worklog" || entry.type === "worklog");
}

/**
 * Total time a task spent in a given column, using status-change timestamps.
 * Includes the current open interval when the task is still in that status.
 */
export function timeSpentInStatus(task: Task, status: TaskStatus, now = Date.now()): number {
  const events = historyEntries(task).filter(
    (entry) => entry.actionType === "status" || entry.actionType === "created" || entry.type === "status" || entry.type === "created",
  );

  let current: string = TASK_COLUMNS[0]?.id ?? "backlog";
  let enteredAt = new Date(task.createdAt).getTime();
  let total = 0;

  if (events.length === 0) {
    return task.status === status ? Math.max(0, now - enteredAt) : 0;
  }

  for (const event of events) {
    const at = new Date(event.timestamp || event.createdAt).getTime();
    if (event.actionType === "created" || event.type === "created") {
      current = event.newValue || current;
      enteredAt = at;
      continue;
    }

    if (matchesStatus(current, status) || matchesStatus(event.oldValue, status)) {
      total += Math.max(0, at - enteredAt);
    }
    current = event.newValue || current;
    enteredAt = at;
  }

  if (matchesStatus(current, status) || task.status === status) {
    if (task.status === status || matchesStatus(current, status)) {
      total += Math.max(0, now - enteredAt);
    }
  }

  return total;
}

export function timeInCurrentColumn(task: Task, now = Date.now()): string {
  return formatDuration(timeSpentInStatus(task, task.status, now));
}
