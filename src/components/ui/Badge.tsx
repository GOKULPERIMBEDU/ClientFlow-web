import { cn } from "@/lib/cn";
import { TASK_COLUMNS, type ClientStatus, type ProjectStatus } from "@/types/domain";

const tones: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-800 ring-emerald-100",
  onboarding: "bg-sky-50 text-sky-800 ring-sky-100",
  paused: "bg-amber-50 text-amber-800 ring-amber-100",
  archived: "bg-slate-100 text-slate-600 ring-slate-200",
  planning: "bg-indigo-50 text-indigo-800 ring-indigo-100",
  on_hold: "bg-amber-50 text-amber-800 ring-amber-100",
  completed: "bg-teal-50 text-teal-800 ring-teal-100",
  cancelled: "bg-rose-50 text-rose-700 ring-rose-100",
  backlog: "bg-slate-100 text-slate-700 ring-slate-200",
  todo: "bg-sky-50 text-sky-800 ring-sky-100",
  in_progress: "bg-aqua-50 text-aqua-700 ring-aqua-100",
  testing_qa: "bg-amber-50 text-amber-800 ring-amber-100",
  client_review: "bg-violet-50 text-violet-800 ring-violet-100",
  draft: "bg-slate-100 text-slate-700 ring-slate-200",
  sent: "bg-sky-50 text-sky-800 ring-sky-100",
  admin: "bg-indigo-50 text-indigo-800 ring-indigo-100",
  lead: "bg-indigo-50 text-indigo-800 ring-indigo-100",
  member: "bg-slate-100 text-slate-600 ring-slate-200",
};

const columnTitles = new Map<string, string>(TASK_COLUMNS.map((column) => [column.id, column.title]));

interface BadgeProps {
  value: ClientStatus | ProjectStatus | string;
  className?: string;
}

export function Badge({ value, className }: BadgeProps) {
  const label = columnTitles.get(value) ?? value.replaceAll("_", " ");
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ring-1",
        tones[value] ?? "bg-slate-100 text-slate-700 ring-slate-200",
        className,
      )}
    >
      {label}
    </span>
  );
}
