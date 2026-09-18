import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/format";
import type { Client, Project } from "@/types/domain";

interface RecentWorkProps {
  clients: Client[];
  projects: Project[];
}

export function RecentWork({ clients, projects }: RecentWorkProps) {
  const clientMap = new Map(clients.map((client) => [client.id, client]));

  return (
    <Card className="p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Portfolio</p>
      <h2 className="mt-1 font-display text-2xl text-ink-950">Active engagements</h2>
      <div className="mt-4 space-y-3">
        {projects.map((project) => {
          const client = clientMap.get(project.clientId);
          return (
            <div
              key={project.id}
              className="flex items-start justify-between gap-3 rounded-2xl border border-ink-100/80 bg-white px-4 py-3"
            >
              <div>
                <p className="font-semibold text-ink-900">{project.name}</p>
                <p className="text-sm text-slate-500">{client?.company ?? "Unassigned client"}</p>
              </div>
              <div className="text-right">
                <Badge value={project.status} />
                <p className="mt-2 text-sm font-medium text-ink-800">
                  {formatCurrency(project.budget, project.currency)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
