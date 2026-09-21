import { cn } from "@/lib/cn";
import { useGuide } from "@/context/GuideContext";
import { useProfile } from "@/context/ProfileContext";
import { useTeam } from "@/context/TeamContext";
import {
  BookOpen,
  ClipboardCheck,
  FolderKanban,
  LayoutDashboard,
  Receipt,
  UserCog,
  UserRound,
  Users,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const nav = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/tasks", label: "Kanban", icon: ClipboardCheck },
  { href: "/invoices", label: "Invoices", icon: Receipt },
  { href: "/team", label: "Team", icon: UserCog, adminOnly: true },
  { href: "/profile", label: "Profile", icon: UserRound },
];

export function Sidebar() {
  const { pathname } = useLocation();
  const { profile } = useProfile();
  const { openGuide } = useGuide();
  const { members, currentUser, isAdmin, setCurrentUserId } = useTeam();
  const companyName = profile?.companyName ?? "";
  const role = currentUser ? (isAdmin ? "Admin" : "Member") : (profile?.role ?? "");

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-white/5 bg-ink-950 text-ink-50 lg:flex">
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-aqua-500/15 ring-1 ring-aqua-400/30">
          <svg viewBox="0 0 32 32" className="h-6 w-6 text-aqua-400" aria-hidden>
            <path
              d="M4 20c6-10 10-10 16 0 4 6 6 6 8 2"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            <path
              d="M4 12c6-8 12-8 18 2"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              opacity="0.55"
            />
          </svg>
        </div>
        <div>
          <p className="font-display text-xl leading-none text-white">ClientFlow</p>
          <p className="mt-1 text-[11px] uppercase tracking-[0.22em] text-slate-400">Studio OS</p>
        </div>
      </div>

      <nav className="mt-2 flex-1 space-y-1 px-3">
        {nav
          .filter((item) => !item.adminOnly || isAdmin)
          .map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                  active
                    ? "bg-white/10 text-white shadow-inner"
                    : "text-slate-400 hover:bg-white/5 hover:text-white",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        <button
          type="button"
          onClick={openGuide}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-aqua-400 transition hover:bg-white/5 hover:text-aqua-300"
        >
          <BookOpen className="h-4 w-4" />
          System Guide
        </button>
      </nav>

      <div className="m-4 space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Workspace</p>
          <p className="mt-1 text-sm font-semibold text-white">{companyName}</p>
          <p className="mt-1 text-xs text-slate-400">{role}</p>
        </div>
        {members.length > 0 ? (
          <label className="block">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Acting as</span>
            <select
              value={currentUser?.id ?? ""}
              onChange={(event) => setCurrentUserId(event.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-ink-950 px-2 py-1.5 text-xs text-white outline-none"
            >
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} ({isAdminRoleLabel(member.role)})
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>
    </aside>
  );
}

function isAdminRoleLabel(role: string) {
  return role === "admin" || role === "lead" ? "Admin" : "Member";
}
