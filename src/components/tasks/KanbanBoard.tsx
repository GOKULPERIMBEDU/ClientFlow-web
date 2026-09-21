import { ActionHint, InfoTip } from "@/components/guide/InfoTip";
import { TaskDetailsModal } from "@/components/tasks/TaskDetailsModal";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { useTeam } from "@/context/TeamContext";
import { api } from "@/lib/api";
import { TASK_COLUMNS, DEFAULT_TASK_STATUS, type Project, type Task, type TaskStatus } from "@/types/domain";
import { GripVertical, Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

export function KanbanBoard() {
  const { notify } = useToast();
  const { actor, currentUser, isAdmin, membersForProject, visibleProjects } = useTeam();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState("");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const userId = currentUser && !isAdmin ? currentUser.id : undefined;
    const [nextTasks, nextProjects] = await Promise.all([api.tasks.list(userId), api.projects.list(userId)]);
    const allowed = visibleProjects(nextProjects);
    setProjects(allowed);
    setTasks(nextTasks.filter((task) => allowed.some((project) => project.id === task.projectId) || isAdmin));
    setProjectId((current) => (current && allowed.some((project) => project.id === current) ? current : ""));
  }, [currentUser, isAdmin, visibleProjects]);

  useEffect(() => {
    setLoading(true);
    load()
      .catch((reason: unknown) => {
        notify(reason instanceof Error ? reason.message : "Unable to load the board", "error");
      })
      .finally(() => setLoading(false));
  }, [load, notify]);

  const addTask = async () => {
    if (!title.trim() || !projectId) {
      notify("Add a title and choose a project", "error");
      return;
    }

    setSaving(true);
    try {
      const created = await api.tasks.create({
        title: title.trim(),
        projectId,
        assignee: actor.actorName,
        status: DEFAULT_TASK_STATUS,
        actorId: actor.actorId,
        actorName: actor.actorName,
      });
      setTasks((current) => [created, ...current]);
      setTitle("");
      notify("Card added");
    } catch (reason) {
      notify(reason instanceof Error ? reason.message : "Unable to add card", "error");
    } finally {
      setSaving(false);
    }
  };

  const selectedTask = tasks.find((task) => task.id === selectedId) ?? null;
  const assignees = useMemo(() => {
    if (!selectedTask) {
      return [];
    }
    const project = projects.find((item) => item.id === selectedTask.projectId);
    const names = membersForProject(project).map((member) => member.name);
    if (selectedTask.assignee && !names.includes(selectedTask.assignee)) {
      names.push(selectedTask.assignee);
    }
    return names;
  }, [membersForProject, projects, selectedTask]);

  const openTask = async (task: Task) => {
    setSelectedId(task.id);
    try {
      const fresh = await api.tasks.get(task.id);
      setTasks((current) => current.map((item) => (item.id === fresh.id ? fresh : item)));
    } catch (reason) {
      notify(reason instanceof Error ? reason.message : "Unable to load task details", "error");
    }
  };

  const moveTask = async (id: string, status: TaskStatus) => {
    const previous = tasks;
    setTasks((current) => current.map((task) => (task.id === id ? { ...task, status } : task)));
    try {
      const updated = await api.tasks.update(id, { status, ...actor });
      setTasks((current) => current.map((task) => (task.id === id ? updated : task)));
    } catch (reason) {
      setTasks(previous);
      notify(reason instanceof Error ? reason.message : "Unable to move card", "error");
    }
  };

  return (
    <div className="space-y-5">
      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-[1.4fr_1fr_auto]">
          <Field label="New task">
            <Input
              placeholder="Enter task title (e.g., Setup Database)..."
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  void addTask();
                }
              }}
            />
          </Field>
          <Field label="Project">
            <Select value={projectId} onChange={(event) => setProjectId(event.target.value)}>
              <option value="">All assigned projects</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </Select>
          </Field>
          <div className="flex items-end">
            <ActionHint
              className="w-full"
              title="Add card"
              hint="POSTs to /api/tasks on the selected project, starting in Backlog. The new card is stored in MongoDB and appears on this board immediately."
            >
              <Button className="w-full" onClick={() => void addTask()} disabled={saving || !projectId}>
                <Plus className="h-4 w-4" />
                {saving ? "Saving..." : "Add card"}
              </Button>
            </ActionHint>
          </div>
        </div>
      </Card>

      {loading ? <p className="text-sm text-slate-500">Loading board from MongoDB...</p> : null}
      {!loading && projects.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-ink-100 px-4 py-6 text-sm text-slate-500">
          No projects are assigned to this member. An admin can grant access from Team.
        </p>
      ) : null}

      <div className="flex items-center gap-2 text-sm text-slate-500">
        <InfoTip title="Move cards" align="left">
          Drag the grip to move a card, or click it to open the full ticket. History records status moves, including moving a card backward.
        </InfoTip>
        <span>Drag cards across columns to update delivery status in MongoDB.</span>
      </div>

      <div className="flex min-h-[28rem] gap-3 overflow-x-auto pb-2">
        {TASK_COLUMNS.map((column) => {
          const columnTasks = tasks.filter(
            (task) => task.status === column.id && (!projectId || task.projectId === projectId),
          );
          return (
            <section
              key={column.id}
              className="w-64 min-w-[16rem] flex-1 rounded-2xl border border-ink-100 bg-white/70 p-3"
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                if (draggingId) {
                  void moveTask(draggingId, column.id);
                  setDraggingId(null);
                }
              }}
            >
              <div className="mb-3 flex items-center justify-between px-1">
                <h2 className="text-sm font-semibold text-ink-900">{column.title}</h2>
                <span className="rounded-full bg-ink-50 px-2 py-0.5 text-xs text-slate-500">{columnTasks.length}</span>
              </div>
              <div className="space-y-3">
                {columnTasks.map((task) => (
                  <article
                    key={task.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => void openTask(task)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        void openTask(task);
                      }
                    }}
                    className="cursor-pointer rounded-2xl border border-ink-100 bg-paper p-3 text-left shadow-sm transition hover:border-aqua-300 hover:shadow-md"
                  >
                    <div className="flex items-start gap-2">
                      <span
                        draggable
                        role="presentation"
                        title="Drag to another column"
                        onClick={(event) => event.stopPropagation()}
                        onDragStart={(event) => {
                          event.stopPropagation();
                          event.dataTransfer.setData("text/plain", task.id);
                          event.dataTransfer.effectAllowed = "move";
                          setDraggingId(task.id);
                        }}
                        className="mt-0.5 shrink-0 cursor-grab text-slate-400 hover:text-ink-700 active:cursor-grabbing"
                      >
                        <GripVertical className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-ink-900">{task.title}</p>
                        <p className="mt-1 text-xs text-slate-500">{task.projectName}</p>
                        <div className="mt-3 flex items-center justify-between gap-2">
                          <Badge value={task.status} />
                          <span className="text-xs font-medium text-slate-500">{task.assignee}</span>
                        </div>
                        {task.dueDate ? <p className="mt-2 text-[11px] text-slate-400">Due {task.dueDate}</p> : null}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <TaskDetailsModal
        task={selectedTask}
        open={Boolean(selectedId)}
        assignees={assignees}
        onClose={() => setSelectedId(null)}
        onUpdated={(updated) => {
          setTasks((current) => current.map((item) => (item.id === updated.id ? updated : item)));
        }}
      />
    </div>
  );
}
