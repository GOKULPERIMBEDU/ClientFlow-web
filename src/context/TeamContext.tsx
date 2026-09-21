import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useProfile } from "@/context/ProfileContext";
import { api } from "@/lib/api";
import { isAdminRole, type Project, type TeamMember } from "@/types/domain";

interface TeamContextValue {
  members: TeamMember[];
  currentUser: TeamMember | null;
  loading: boolean;
  isAdmin: boolean;
  actor: { actor: string; actorId?: string; actorName: string };
  refresh: () => Promise<void>;
  setCurrentUserId: (id: string) => void;
  canAccessProject: (project: string | Project) => boolean;
  visibleProjects: (projects: Project[]) => Project[];
  membersForProject: (project: Project | null | undefined) => TeamMember[];
}

const TeamContext = createContext<TeamContextValue | null>(null);

function pickCurrentUser(members: TeamMember[], profileEmail?: string | null): TeamMember | null {
  if (members.length === 0) {
    return null;
  }
  const fromEmail = profileEmail
    ? members.find((member) => member.email.toLowerCase() === profileEmail.toLowerCase())
    : null;
  return fromEmail ?? members.find((member) => isAdminRole(member.role)) ?? members[0] ?? null;
}

export function TeamProvider({ children }: { children: ReactNode }) {
  const { profile } = useProfile();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [currentUserId, setCurrentUserIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const next = await api.users.list();
      setMembers(next);
      setCurrentUserIdState((current) => {
        if (current && next.some((member) => member.id === current)) {
          return current;
        }
        return pickCurrentUser(next, profile?.email)?.id ?? null;
      });
    } finally {
      setLoading(false);
    }
  }, [profile?.email]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const setCurrentUserId = useCallback((id: string) => {
    setCurrentUserIdState(id);
  }, []);

  const currentUser = useMemo(
    () => members.find((member) => member.id === currentUserId) ?? pickCurrentUser(members, profile?.email),
    [currentUserId, members, profile?.email],
  );

  const isAdmin = isAdminRole(currentUser?.role);

  const canAccessProject = useCallback(
    (project: string | Project) => {
      if (!currentUser || isAdminRole(currentUser.role)) {
        return true;
      }
      if (typeof project === "string") {
        return currentUser.assignedProjects.includes(project);
      }
      return (project.assignedTeam ?? []).includes(currentUser.id) || currentUser.assignedProjects.includes(project.id);
    },
    [currentUser],
  );

  const visibleProjects = useCallback(
    (projects: Project[]) => projects.filter((project) => canAccessProject(project)),
    [canAccessProject],
  );

  const membersForProject = useCallback(
    (project: Project | null | undefined) => {
      const ids = project?.assignedTeam ?? [];
      if (ids.length === 0) {
        return [];
      }
      return members.filter((member) => ids.includes(member.id));
    },
    [members],
  );

  const actor = useMemo(
    () => ({
      actor: currentUser?.name || profile?.name || "Studio Lead",
      actorId: currentUser?.id,
      actorName: currentUser?.name || profile?.name || "Studio Lead",
    }),
    [currentUser, profile?.name],
  );

  const value = useMemo(
    () => ({
      members,
      currentUser,
      loading,
      isAdmin,
      actor,
      refresh,
      setCurrentUserId,
      canAccessProject,
      visibleProjects,
      membersForProject,
    }),
    [
      actor,
      canAccessProject,
      currentUser,
      isAdmin,
      loading,
      members,
      membersForProject,
      refresh,
      setCurrentUserId,
      visibleProjects,
    ],
  );

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>;
}

export function useTeam() {
  const context = useContext(TeamContext);
  if (!context) {
    throw new Error("useTeam must be used within TeamProvider");
  }
  return context;
}
