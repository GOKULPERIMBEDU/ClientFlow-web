"use client";

import { ActionHint, InfoTip } from "@/components/guide/InfoTip";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { api } from "@/lib/api";
import { TASK_COLUMNS, type Project, type Task, type TaskStatus } from "@/types/domain";
import { Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export function KanbanBoard() {
  const { notify } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState("");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const [nextTasks, nextProjects] = await Promise.all([api.tasks.list(), api.projects.list()]);
    setTasks(nextTasks);
    setProjects(nextProjects);
    setProjectId((current) => current || nextProjects[0]?.id || "");
  }, []);

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
        assignee: "Priya",
        status: "todo",
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

  const moveTask = async (id: string, status: TaskStatus) => {
    const previous = tasks;
    setTasks((current) => current.map((task) => (task.id === id ? { ...task, status } : task)));
    try {
      const updated = await api.tasks.update(id, { status });
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
              placeholder="What needs to move?"
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
              {projects.length === 0 ? <option value="">No projects loaded</option> : null}
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
              hint="POSTs to /api/tasks on the selected project, starting in To do. The new card is stored in MongoDB and appears on this board immediately."
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

      <div className="flex items-center gap-2 text-sm text-slate-500">
        <InfoTip title="Move cards" align="left">
          Drag a card into another column. The drop sends PUT /api/tasks/:id with the new status so workflow tracking is persisted in MongoDB, not only in the browser.
        </InfoTip>
        <span>Drag cards across columns to update delivery status in MongoDB.</span>
      </div>

      <div className="grid gap-4 xl:grid-cols-4">
        {TASK_COLUMNS.map((column) => {
          const columnTasks = tasks.filter((task) => task.status === column.id);
          return (
            <section
              key={column.id}
              className="rounded-2xl border border-ink-100 bg-white/70 p-3"
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
                <span className="rounded-full bg-ink-50 px-2 py-0.5 text-xs text-slate-500">
                  {columnTasks.length}
                </span>
              </div>
              <div className="space-y-3">
                {columnTasks.map((task) => (
                  <article
                    key={task.id}
                    draggable
                    onDragStart={() => setDraggingId(task.id)}
                    className="cursor-grab rounded-2xl border border-ink-100 bg-paper p-3 shadow-sm active:cursor-grabbing"
                  >
                    <p className="font-medium text-ink-900">{task.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{task.projectName}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <Badge value={task.status} />
                      <span className="text-xs font-medium text-slate-500">{task.assignee}</span>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
