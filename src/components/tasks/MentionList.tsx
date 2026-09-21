import { initialsFromName } from "@/lib/format";
import type { TeamMember } from "@/types/domain";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";

export interface MentionListHandle {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

interface MentionListProps {
  items: TeamMember[];
  command: (item: { id: string; label: string }) => void;
}

export const MentionList = forwardRef<MentionListHandle, MentionListProps>(function MentionList(
  { items, command },
  ref,
) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === "ArrowUp") {
        setIndex((current) => (current + items.length - 1) % Math.max(items.length, 1));
        return true;
      }
      if (event.key === "ArrowDown") {
        setIndex((current) => (current + 1) % Math.max(items.length, 1));
        return true;
      }
      if (event.key === "Enter") {
        const item = items[index];
        if (item) {
          command({ id: item.id, label: item.name });
        }
        return true;
      }
      return false;
    },
  }));

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-ink-100 bg-white px-3 py-2 text-sm text-slate-500 shadow-card">
        No teammates match
      </div>
    );
  }

  return (
    <div className="w-72 overflow-hidden rounded-xl border border-ink-100 bg-white py-1 shadow-card">
      {items.map((item, itemIndex) => (
        <button
          key={item.id}
          type="button"
          onClick={() => command({ id: item.id, label: item.name })}
          className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm ${
            itemIndex === index ? "bg-aqua-50 text-aqua-900" : "text-ink-800 hover:bg-ink-50"
          }`}
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink-900 text-[10px] font-semibold text-white">
            {initialsFromName(item.name)}
          </span>
          <span className="min-w-0">
            <span className="block truncate font-semibold">{item.name}</span>
            <span className="block truncate text-[11px] text-slate-500">{item.email}</span>
          </span>
        </button>
      ))}
    </div>
  );
});
