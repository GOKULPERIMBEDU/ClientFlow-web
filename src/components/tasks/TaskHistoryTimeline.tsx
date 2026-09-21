import { Badge } from "@/components/ui/Badge";
import { formatDateTime, initialsFromName } from "@/lib/format";
import { formatDuration, historyLog } from "@/lib/task-history";
import { type Task, type TaskActivity, type TaskStatus } from "@/types/domain";
import { ArrowRight } from "lucide-react";

function actionCopy(entry: TaskActivity): string {
  if (entry.message) {
    return entry.message;
  }
  switch (entry.actionType) {
    case "created":
      return "created this task";
    case "status":
      return "changed the Status";
    case "assignee":
      return "changed the Assignee";
    case "attachment":
      return "added an Attachment";
    default:
      return "updated this task";
  }
}

function statusIdFromLabel(value: string): TaskStatus | null {
  const normalized = value.trim().toLowerCase();
  if (normalized === "backlog") return "backlog";
  if (normalized === "todo" || normalized === "to do") return "todo";
  if (normalized === "in_progress" || normalized === "in progress") return "in_progress";
  if (normalized === "testing_qa" || normalized === "testing / qa") return "testing_qa";
  if (normalized === "client_review" || normalized === "client review") return "client_review";
  if (normalized === "completed") return "completed";
  return null;
}

function ValueChip({ value, kind }: { value: string; kind: TaskActivity["actionType"] }) {
  if (!value) {
    return <span className="text-sm text-slate-400">None</span>;
  }
  if (kind === "status" || statusIdFromLabel(value)) {
    return <Badge value={statusIdFromLabel(value) ?? value} />;
  }
  return (
    <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-ink-800 ring-1 ring-slate-200">
      {value}
    </span>
  );
}

export function TaskHistoryTimeline({ task }: { task: Task }) {
  const entries = historyLog(task);

  if (entries.length === 0) {
    return <p className="text-sm text-slate-500">No history yet. Status and assignee changes will appear here.</p>;
  }

  return (
    <ol className="relative ml-3 space-y-0 border-l border-ink-100 pl-6">
      {entries.map((entry, index) => {
        const previous = entries[index - 1];
        const dwell =
          entry.actionType === "status" && previous
            ? formatDuration(
                new Date(entry.timestamp || entry.createdAt).getTime() -
                  new Date(previous.timestamp || previous.createdAt).getTime(),
              )
            : null;
        const name = entry.userName || entry.author;
        return (
          <li key={entry.id} className="relative pb-6">
            <span className="absolute -left-[31px] top-1.5 h-3 w-3 rounded-full border-2 border-white bg-aqua-500 ring-1 ring-aqua-200" />
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-ink-900">{name}</p>
                <p className="text-sm text-slate-500">{actionCopy(entry)}</p>
              </div>
              <p className="text-[11px] text-slate-400">{formatDateTime(entry.timestamp || entry.createdAt)}</p>
            </div>
            {entry.oldValue || entry.newValue ? (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <ValueChip value={entry.oldValue} kind={entry.actionType} />
                <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                <ValueChip value={entry.newValue} kind={entry.actionType} />
              </div>
            ) : null}
            {dwell ? (
              <p className="mt-1.5 text-[11px] text-slate-400">
                Time in {entry.oldValue || "previous status"}: {dwell}
              </p>
            ) : null}
            <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink-50 text-[10px] font-semibold text-ink-800">
                {initialsFromName(name)}
              </span>
              {name}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
