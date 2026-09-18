import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";

interface StatsCardProps {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
}

export function StatsCard({ label, value, hint, icon: Icon }: StatsCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
          <p className="mt-2 font-display text-3xl text-ink-950">{value}</p>
          <p className="mt-2 text-sm text-slate-500">{hint}</p>
        </div>
        <div className="rounded-2xl bg-aqua-50 p-2.5 text-aqua-700">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}
