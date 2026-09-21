import { ActionHint } from "@/components/guide/InfoTip";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { TeamMultiSelect } from "@/components/projects/TeamMultiSelect";
import { useTeam } from "@/context/TeamContext";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Client, CreateProjectInput, Project, ProjectStatus } from "@/types/domain";
import { Plus, Trash2, Users } from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";

const emptyForm: CreateProjectInput = {
  clientId: "",
  name: "",
  description: "",
  status: "planning",
  budget: 25000,
  currency: "USD",
  startDate: "2026-09-21",
  endDate: "2026-12-21",
  assignedTeam: [],
};

export function ProjectManager() {
  const { notify } = useToast();
  const { currentUser, isAdmin, members, refresh, visibleProjects } = useTeam();
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [open, setOpen] = useState(false);
  const [teamProject, setTeamProject] = useState<Project | null>(null);
  const [teamIds, setTeamIds] = useState<string[]>([]);
  const [savingTeam, setSavingTeam] = useState(false);
  const [form, setForm] = useState<CreateProjectInput>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const userId = currentUser && !isAdmin ? currentUser.id : undefined;
    const [nextProjects, nextClients] = await Promise.all([api.projects.list(userId), api.clients.list()]);
    setProjects(visibleProjects(nextProjects));
    setClients(nextClients);
    setForm((current) => ({
      ...current,
      clientId: current.clientId || nextClients[0]?.id || "",
    }));
    setError(null);
  }, [currentUser, isAdmin, visibleProjects]);

  useEffect(() => {
    setLoading(true);
    load()
      .catch((reason: unknown) => {
        const message = reason instanceof Error ? reason.message : "Unable to load projects";
        setError(message);
        notify(message, "error");
      })
      .finally(() => setLoading(false));
  }, [load, notify]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.projects.create({ ...form, budget: Number(form.budget), assignedTeam: form.assignedTeam ?? [] });
      setOpen(false);
      setForm({ ...emptyForm, clientId: clients[0]?.id || "" });
      await load();
      await refresh();
      notify("Project created");
    } catch (reason) {
      notify(reason instanceof Error ? reason.message : "Unable to create project", "error");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id: string) => {
    try {
      await api.projects.remove(id);
      await load();
      notify("Project deleted");
    } catch (reason) {
      notify(reason instanceof Error ? reason.message : "Unable to delete project", "error");
    }
  };

  const clientName = (clientId: string) =>
    clients.find((client) => client.id === clientId)?.company ?? "Unknown client";

  const openTeamAccess = (project: Project) => {
    setTeamProject(project);
    setTeamIds(project.assignedTeam ?? []);
  };

  const saveTeamAccess = async () => {
    if (!teamProject) {
      return;
    }
    setSavingTeam(true);
    try {
      await api.projects.update(teamProject.id, { assignedTeam: teamIds });
      setTeamProject(null);
      await load();
      await refresh();
      notify("Project team updated");
    } catch (reason) {
      notify(reason instanceof Error ? reason.message : "Unable to update project team", "error");
    } finally {
      setSavingTeam(false);
    }
  };

  const memberNames = (project: Project) => {
    const ids = project.assignedTeam ?? [];
    if (ids.length === 0) {
      return "No members assigned";
    }
    return members
      .filter((member) => ids.includes(member.id))
      .map((member) => member.name)
      .join(", ");
  };

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {loading ? "Loading portfolio..." : `${projects.length} engagements in the portfolio`}
        </p>
        <ActionHint
          title="New project"
          hint="POSTs to /api/projects with a clientId. Budget and status are stored in MongoDB and then read by the overview stats and Kanban project picker."
        >
          <Button onClick={() => setOpen(true)} disabled={clients.length === 0 || !isAdmin}>
            <Plus className="h-4 w-4" />
            New project
          </Button>
        </ActionHint>
      </div>

      {error ? (
        <p className="mb-4 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">{error}</p>
      ) : null}

      {loading ? (
        <Card className="p-6 text-sm text-slate-500">Fetching projects from MongoDB...</Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {projects.length === 0 ? (
            <Card className="p-6 text-sm text-slate-500">
              No projects are assigned to this member. An admin can grant access from Team.
            </Card>
          ) : null}
          {projects.map((project) => (
            <Card key={project.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl text-ink-950">{project.name}</h2>
                  <p className="mt-1 text-sm text-slate-500">{clientName(project.clientId)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Badge value={project.status} />
                  {isAdmin ? (
                    <Button variant="ghost" onClick={() => void onDelete(project.id)} aria-label="Delete project">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  ) : null}
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">{project.description}</p>
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
                <span>{formatCurrency(project.budget, project.currency)}</span>
                <span>
                  {formatDate(project.startDate)} – {formatDate(project.endDate)}
                </span>
              </div>
              <p className="mt-3 text-xs text-slate-500">
                <span className="font-semibold text-slate-600">Team: </span>
                {memberNames(project)}
              </p>
              {isAdmin ? (
                <Button variant="secondary" className="mt-3" onClick={() => openTeamAccess(project)}>
                  <Users className="h-4 w-4" />
                  Manage Team Access
                </Button>
              ) : null}
            </Card>
          ))}
        </div>
      )}

      <Modal open={open} title="Add project" onClose={() => setOpen(false)}>
        <form className="space-y-3" onSubmit={onSubmit}>
          <Field label="Client">
            <Select
              value={form.clientId}
              onChange={(event) => setForm({ ...form, clientId: event.target.value })}
              required
            >
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.company}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Project name">
            <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          </Field>
          <Field label="Description">
            <Textarea
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              required
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Budget">
              <Input
                type="number"
                min={0}
                value={form.budget}
                onChange={(event) => setForm({ ...form, budget: Number(event.target.value) })}
                required
              />
            </Field>
            <Field label="Currency">
              <Select
                value={form.currency}
                onChange={(event) => setForm({ ...form, currency: event.target.value })}
              >
                <option value="USD">USD ($)</option>
                <option value="INR">INR (₹)</option>
              </Select>
            </Field>
            <Field label="Status">
              <Select
                value={form.status}
                onChange={(event) => setForm({ ...form, status: event.target.value as ProjectStatus })}
              >
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="on_hold">On hold</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </Select>
            </Field>
            <Field label="Start">
              <Input
                type="date"
                value={form.startDate}
                onChange={(event) => setForm({ ...form, startDate: event.target.value })}
                required
              />
            </Field>
            <Field label="End">
              <Input
                type="date"
                value={form.endDate}
                onChange={(event) => setForm({ ...form, endDate: event.target.value })}
                required
              />
            </Field>
          </div>
          <TeamMultiSelect
            members={members}
            selectedIds={form.assignedTeam ?? []}
            onChange={(assignedTeam) => setForm({ ...form, assignedTeam })}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Create project"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={Boolean(teamProject)} title="Manage Team Access" onClose={() => setTeamProject(null)}>
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Choose who can work on {teamProject?.name}. Only these members appear in the Delivery board assignee list.
          </p>
          <TeamMultiSelect members={members} selectedIds={teamIds} onChange={setTeamIds} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setTeamProject(null)}>
              Cancel
            </Button>
            <Button onClick={() => void saveTeamAccess()} disabled={savingTeam}>
              {savingTeam ? "Saving..." : "Save access"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
