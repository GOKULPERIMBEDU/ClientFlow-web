import { Button } from "@/components/ui/Button";
import { useGuide } from "@/context/GuideContext";
import {
  ClipboardCheck,
  FolderKanban,
  Globe2,
  Receipt,
  Sparkles,
  X,
} from "lucide-react";

const modules = [
  {
    icon: Globe2,
    title: "Global Timezone Converter",
    tag: "Multi-hub clocks",
    body: "Live world-clock hubs — Sydney (AEST), India (IST), London (GMT), and New York (EST) — plus a converter for international standups. Time math runs in the browser; no login required.",
  },
  {
    icon: FolderKanban,
    title: "Client & Project Directory",
    tag: "MongoDB-backed",
    body: "CRM accounts and engagements persist through POST / PUT / DELETE on /api/clients and /api/projects. Those records feed Kanban and invoices.",
  },
  {
    icon: ClipboardCheck,
    title: "Kanban Delivery Board",
    tag: "Workflow tracking",
    body: "Add cards via POST /api/tasks, then drag them Backlog → Completed. Click a card to open the Jira-style ticket panel for description, attachments, due dates, and comments.",
  },
  {
    icon: Receipt,
    title: "Automated Invoice Generator",
    tag: "Billing",
    body: "Compose line items from live clients, save with POST/PUT /api/invoices, then print or save a PDF of the MongoDB-backed document.",
  },
];

export function WelcomeGuide() {
  const { open, closeGuide } = useGuide();

  if (!open) {
    return null;
  }

  return (
    <div
      className="guide-overlay fixed inset-0 z-[70] flex items-center justify-center bg-ink-950/70 p-4 backdrop-blur-md"
      onClick={() => closeGuide(true)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-guide-title"
        className="guide-panel relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-white/10 bg-paper shadow-card"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="bg-ink-950 px-6 py-6 text-white sm:px-8">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-aqua-400">
            <Sparkles className="h-3.5 w-3.5" />
            Global agency SaaS · No login wall
          </p>
          <h2 id="welcome-guide-title" className="mt-2 font-display text-3xl leading-tight sm:text-4xl">
            Welcome to ClientFlow
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Studio OS for digital agencies managing international clients across global timezones.
          </p>
        </div>

        <button
          type="button"
          onClick={() => closeGuide(true)}
          className="absolute right-4 top-4 rounded-full p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
          aria-label="Close welcome guide"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="space-y-6 p-6 sm:p-8">
          <section>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-aqua-700">Why it is used</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              ClientFlow is a full-stack SaaS platform for digital agencies, remote studios, and freelancers
              who serve international clients across global timezones — including hubs such as Sydney, New
              York, London, and India. It replaces a scatter of CRMs, boards, and billing tools with one
              professional workspace: client records, project pipelines, and invoices in a MongoDB-backed
              system that opens immediately, with no authentication gate.
            </p>
          </section>

          <section>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-aqua-700">How it works</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              The React dashboard talks to a layered Express API. Each module below is live: create, update,
              and move work, and it persists.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {modules.map((module) => {
                const Icon = module.icon;
                return (
                  <div key={module.title} className="rounded-2xl border border-ink-100 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-aqua-50 text-aqua-700">
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="rounded-full bg-ink-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        {module.tag}
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-semibold text-ink-900">{module.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-slate-500">{module.body}</p>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-ink-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="text-xs text-slate-500">
            Reopen this Why & How tour anytime from{" "}
            <span className="font-semibold text-ink-800">System Guide</span> in the sidebar.
          </p>
          <Button className="px-5" onClick={() => closeGuide(true)}>
            Explore Demo
          </Button>
        </div>
      </div>
    </div>
  );
}
