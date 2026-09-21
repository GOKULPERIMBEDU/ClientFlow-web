import { initialsFromName } from "@/lib/format";
import type { TeamMember } from "@/types/domain";

interface TeamMultiSelectProps {
  members: TeamMember[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  label?: string;
}

export function TeamMultiSelect({
  members,
  selectedIds,
  onChange,
  label = "Assign Team Members",
}: TeamMultiSelectProps) {
  const toggle = (id: string) => {
    onChange(selectedIds.includes(id) ? selectedIds.filter((item) => item !== id) : [...selectedIds, id]);
  };

  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <div className="max-h-56 space-y-1 overflow-y-auto rounded-xl border border-ink-100 bg-white p-2">
        {members.length === 0 ? (
          <p className="px-2 py-3 text-sm text-slate-500">No team members in MongoDB yet.</p>
        ) : (
          members.map((member) => {
            const checked = selectedIds.includes(member.id);
            return (
              <label
                key={member.id}
                className={`flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm ${
                  checked ? "bg-aqua-50 text-aqua-900" : "text-ink-800 hover:bg-ink-50"
                }`}
              >
                <input
                  type="checkbox"
                  className="accent-aqua-600"
                  checked={checked}
                  onChange={() => toggle(member.id)}
                />
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink-900 text-[10px] font-semibold text-white">
                  {initialsFromName(member.name)}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{member.name}</span>
                  <span className="block truncate text-[11px] text-slate-500">{member.email}</span>
                </span>
                <span className="ml-auto text-[11px] capitalize text-slate-400">
                  {member.role === "admin" || member.role === "lead" ? "Admin" : "Member"}
                </span>
              </label>
            );
          })
        )}
      </div>
    </div>
  );
}
