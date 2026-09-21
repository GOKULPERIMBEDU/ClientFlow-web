import { StatsCard } from "@/components/dashboard/StatsCard";
import { TimezoneWidget } from "@/components/dashboard/TimezoneWidget";
import { RecentWork } from "@/components/dashboard/RecentWork";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { useTeam } from "@/context/TeamContext";
import type { Client, Invoice, Project } from "@/types/domain";
import { CircleDollarSign, FolderKanban, Receipt, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export function DashboardView() {
  const { currentUser, isAdmin, visibleProjects } = useTeam();
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = currentUser && !isAdmin ? currentUser.id : undefined;
    Promise.all([api.clients.list(), api.projects.list(userId), api.invoices.list()])
      .then(([nextClients, nextProjects, nextInvoices]) => {
        setClients(nextClients);
        setProjects(visibleProjects(nextProjects));
        setInvoices(nextInvoices);
      })
      .catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : "Unable to load workspace data");
      })
      .finally(() => setLoading(false));
  }, [currentUser, isAdmin, visibleProjects]);

  const stats = useMemo(() => {
    const activeProjects = projects.filter((project) => project.status === "active").length;
    const pipelineByCurrency = projects
      .filter((project) => project.status !== "cancelled")
      .reduce<Record<string, number>>((totals, project) => {
        totals[project.currency] = (totals[project.currency] ?? 0) + project.budget;
        return totals;
      }, {});
    const pipeline = Object.entries(pipelineByCurrency)
      .map(([currency, amount]) => formatCurrency(amount, currency))
      .join(" · ") || formatCurrency(0);
    const invoiced = invoices.reduce((sum, invoice) => sum + invoice.total, 0);
    const onboarding = clients.filter((client) => client.status === "onboarding").length;

    return { activeProjects, pipeline, invoiced, onboarding };
  }, [clients, invoices, projects]);

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {error}. Start the API on port 4000, then refresh.
        </div>
      ) : null}

      {loading ? <p className="text-sm text-slate-500">Loading live workspace data...</p> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          label="Clients"
          value={String(clients.length)}
          hint={`${stats.onboarding} currently onboarding`}
          icon={Users}
        />
        <StatsCard
          label="Active projects"
          value={String(stats.activeProjects)}
          hint={`${projects.length} in the full portfolio`}
          icon={FolderKanban}
        />
        <StatsCard
          label="Pipeline"
          value={stats.pipeline}
          hint="Open and scheduled retainers"
          icon={CircleDollarSign}
        />
        <StatsCard
          label="Invoiced"
          value={formatCurrency(stats.invoiced)}
          hint={`${invoices.length} documents in MongoDB`}
          icon={Receipt}
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <TimezoneWidget />
        <RecentWork clients={clients} projects={projects} />
      </div>
    </div>
  );
}
