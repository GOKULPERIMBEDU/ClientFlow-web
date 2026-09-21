import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { useTeam } from "@/context/TeamContext";
import { api } from "@/lib/api";
import { initialsFromName } from "@/lib/format";
import { isAdminRole, type CreateTeamMemberInput, type Project, type TeamMember, type UserRole } from "@/types/domain";
import { Plus, Trash2, UserPlus } from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

const emptyForm: CreateTeamMemberInput = {
  name: "",
  email: "",
  role: "member",
  assignedProjects: [],
};

export function TeamManager() {
  const { notify } = useToast();
  const { isAdmin, refresh: refreshTeam } = useTeam();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CreateTeamMemberInput>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const workspaceMembers = useMemo(
    () => members.filter((member) => member.role === "member" && !isAdminRole(member.role)),
    [members],
  );

  const activeProjects = useMemo(
    () => projects.filter((project) => project.status === "active" || project.status === "planning"),
    [projects],
  );

  const load = useCallback(async () => {
    const [nextMembers, nextProjects] = await Promise.all([api.users.list(), api.projects.list()]);
    setMembers(nextMembers);
    setProjects(nextProjects);
  }, []);

  useEffect(() => {
    setLoading(true);
    load()
      .catch((reason: unknown) => {
        notify(reason instanceof Error ? reason.message : "Unable to load the team", "error");
      })
      .finally(() => setLoading(false));
  }, [load, notify]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.users.create(form);
      setForm(emptyForm);
      setOpen(false);
      await load();
      await refreshTeam();
      notify("Team member added");
    } catch (reason) {
      notify(reason instanceof Error ? reason.message : "Unable to add member", "error");
    } finally {
      setSaving(false);
    }
  };

  const updateMember = async (id: string, input: Partial<CreateTeamMemberInput>) => {
    try {
      const updated = await api.users.update(id, input);
      setMembers((current) => current.map((member) => (member.id === updated.id ? updated : member)));
      await refreshTeam();
    } catch (reason) {
      notify(reason instanceof Error ? reason.message : "Unable to update member", "error");
    }
  };

  const toggleProject = (member: TeamMember, projectId: string) => {
    const assigned = member.assignedProjects.includes(projectId)
      ? member.assignedProjects.filter((id) => id !== projectId)
      : [...member.assignedProjects, projectId];
    void updateMember(member.id, { assignedProjects: assigned });
  };

  const onDelete = async (id: string) => {
    try {
      await api.users.remove(id);
      await load();
      await refreshTeam();
      notify("Member removed");
    } catch (reason) {
      notify(reason instanceof Error ? reason.message : "Unable to remove member", "error");
    }
  };

  if (!isAdmin) {
    return (
      <Card className="p-6">
        <p className="text-sm text-slate-600">Team management is available to Admin users only.</p>
      </Card>
    );
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {loading
            ? "Loading team..."
            : `${workspaceMembers.length} ${workspaceMembers.length === 1 ? "member" : "members"} in the workspace`}
        </p>
        <Button onClick={() => setOpen(true)}>
          <UserPlus className="h-4 w-4" />
          Invite member
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-ink-50/80 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Member</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Assigned projects</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-8 text-slate-500" colSpan={4}>
                    Fetching team from MongoDB...
                  </td>
                </tr>
              ) : workspaceMembers.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-slate-500" colSpan={4}>
                    No members in the workspace yet.
                  </td>
                </tr>
              ) : (
                workspaceMembers.map((member) => (
                  <tr key={member.id} className="border-t border-ink-50">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ink-900 text-xs font-semibold text-white">
                          {initialsFromName(member.name)}
                        </div>
                        <div>
                          <p className="font-semibold text-ink-900">{member.name}</p>
                          <p className="text-xs text-slate-500">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Select
                        value={isAdminRole(member.role) ? "admin" : "member"}
                        onChange={(event) => void updateMember(member.id, { role: event.target.value as UserRole })}
                        className="w-32"
                      >
                        <option value="admin">Admin</option>
                        <option value="member">Member</option>
                      </Select>
                    </td>
                    <td className="px-4 py-4">
                      {isAdminRole(member.role) ? (
                        <p className="text-xs text-slate-500">All projects</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {activeProjects.map((project) => {
                            const checked = member.assignedProjects.includes(project.id);
                            return (
                              <label
                                key={project.id}
                                className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${
                                  checked ? "bg-aqua-50 text-aqua-800 ring-aqua-100" : "bg-white text-slate-500 ring-ink-100"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  className="sr-only"
                                  checked={checked}
                                  onChange={() => toggleProject(member, project.id)}
                                />
                                {project.name}
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Button variant="ghost" onClick={() => void onDelete(member.id)} aria-label={`Remove ${member.name}`}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={open} title="Invite team member" onClose={() => setOpen(false)}>
        <form className="space-y-3" onSubmit={onSubmit}>
          <Field label="Name">
            <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          </Field>
          <Field label="Email">
            <Input
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              required
            />
          </Field>
          <Field label="Role">
            <Select
              value={form.role}
              onChange={(event) => setForm({ ...form, role: event.target.value as UserRole })}
            >
              <option value="admin">Admin</option>
              <option value="member">Member</option>
            </Select>
          </Field>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Assign to active projects</p>
            <div className="space-y-2">
              {activeProjects.map((project) => {
                const checked = form.assignedProjects?.includes(project.id) ?? false;
                return (
                  <label key={project.id} className="flex items-center gap-2 text-sm text-ink-800">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        const current = form.assignedProjects ?? [];
                        setForm({
                          ...form,
                          assignedProjects: checked ? current.filter((id) => id !== project.id) : [...current, project.id],
                        });
                      }}
                    />
                    {project.name}
                    <Badge value={project.status} />
                  </label>
                );
              })}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              <Plus className="h-4 w-4" />
              {saving ? "Saving..." : "Add member"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
