import { Button } from "@/components/ui/Button";
import { useGuide } from "@/context/GuideContext";
import { useProfile } from "@/context/ProfileContext";
import { useTeam } from "@/context/TeamContext";
import { initialsFromName } from "@/lib/format";
import { normalizePathname } from "@/lib/route";
import {
  BookOpen,
  ClipboardCheck,
  FolderKanban,
  LayoutDashboard,
  Menu,
  Receipt,
  UserCog,
  UserRound,
  Users,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

const titles: Record<string, { title: string; subtitle: string }> = {
  "/": { title: "Operations overview", subtitle: "Clients, delivery, and cashflow across global timezones." },
  "/clients": { title: "Client directory", subtitle: "Accounts, contacts, and engagement status." },
  "/projects": { title: "Project portfolio", subtitle: "Budgets, timelines, and delivery state." },
  "/tasks": { title: "Delivery board", subtitle: "Move work from backlog through QA and client review to completed." },
  "/invoices": { title: "Invoice studio", subtitle: "Compose a live invoice from client data." },
  "/team": { title: "Team management", subtitle: "Invite members and assign them to active projects." },
  "/profile": { title: "Profile settings", subtitle: "Your name, role, and studio identity." },
};

const mobileNav = [
  { href: "/", icon: LayoutDashboard, label: "Overview" },
  { href: "/clients", icon: Users, label: "Clients" },
  { href: "/projects", icon: FolderKanban, label: "Projects" },
  { href: "/tasks", icon: ClipboardCheck, label: "Kanban" },
  { href: "/invoices", icon: Receipt, label: "Invoices" },
  { href: "/team", icon: UserCog, label: "Team", adminOnly: true },
  { href: "/profile", icon: UserRound, label: "Profile" },
];

export function Header() {
  const { pathname: rawPathname } = useLocation();
  const pathname = normalizePathname(rawPathname);
  const meta = titles[pathname] ?? titles["/"];
  const [open, setOpen] = useState(false);
  const { profile } = useProfile();
  const { isAdmin, loading: teamLoading } = useTeam();
  const { openGuide } = useGuide();
  const name = profile?.name ?? "";
  const subtitle = profile?.role ?? "";
  const initials = initialsFromName(name || "Client Flow");
  const showAdminNav = teamLoading || isAdmin;

  return (
    <header className="sticky top-0 z-30 border-b border-ink-100/70 bg-canvas/85 backdrop-blur">
      <div className="flex items-center justify-between px-4 py-4 lg:px-8">
        <div className="flex items-center gap-3">
          <Button variant="secondary" className="lg:hidden" onClick={() => setOpen((value) => !value)}>
            <Menu className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="font-display text-2xl text-ink-950">{meta?.title}</h1>
            <p className="text-sm text-slate-500">{meta?.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            className="lg:hidden"
            onClick={openGuide}
            aria-label="Open System Guide"
          >
            <BookOpen className="h-4 w-4" />
          </Button>
          <Link to="/profile" className="flex items-center gap-3 rounded-2xl px-2 py-1 hover:bg-white/70">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-ink-900">{name}</p>
              <p className="text-xs text-slate-500">{subtitle}</p>
            </div>
            {profile?.avatarUrl ? (
              <img src={profile.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ink-900 text-sm font-semibold text-white">
                {initials}
              </div>
            )}
          </Link>
        </div>
      </div>
      {open ? (
        <div className="grid grid-cols-6 gap-1 border-t border-ink-100 px-3 py-2 lg:hidden">
          {mobileNav
            .filter((item) => !item.adminOnly || showAdminNav)
            .map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setOpen(false)}
                className="flex flex-col items-center rounded-xl px-2 py-2 text-[11px] font-medium text-slate-600 hover:bg-white"
              >
                <Icon className="mb-1 h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      ) : null}
    </header>
  );
}
