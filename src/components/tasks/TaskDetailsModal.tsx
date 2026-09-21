import { TaskActivityFeed } from "@/components/tasks/TaskActivityFeed";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { useTeam } from "@/context/TeamContext";
import { api, resolveApiUrl } from "@/lib/api";
import { timeInCurrentColumn } from "@/lib/task-history";
import { TASK_COLUMNS, type Task, type TaskStatus } from "@/types/domain";
import { CalendarClock, Clock3, Paperclip, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";

interface TaskDetailsModalProps {
  task: Task | null;
  open: boolean;
  assignees: string[];
  onClose: () => void;
  onUpdated: (task: Task) => void;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function TaskDetailsModal({ task, open, assignees, onClose, onUpdated }: TaskDetailsModalProps) {
  const { notify } = useToast();
  const { actor } = useTeam();
  const [draft, setDraft] = useState(task);
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!open || !task) {
      return;
    }
    setDraft(task);
    setDescription(task.description ?? "");
  }, [open, task]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !draft) {
    return null;
  }

  const persist = async (patch: Parameters<typeof api.tasks.update>[1]) => {
    setSaving(true);
    try {
      const updated = await api.tasks.update(draft.id, { ...patch, ...actor });
      setDraft(updated);
      onUpdated(updated);
      return updated;
    } catch (reason) {
      notify(reason instanceof Error ? reason.message : "Unable to update task", "error");
      return null;
    } finally {
      setSaving(false);
    }
  };

  const saveDescription = async () => {
    if (description === (draft.description ?? "")) {
      return;
    }
    await persist({ description });
  };

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) {
      return;
    }
    setUploading(true);
    try {
      let latest = draft;
      for (const file of Array.from(files)) {
        const contentBase64 = await readFileAsDataUrl(file);
        latest = await api.tasks.addAttachment(draft.id, {
          name: file.name,
          mimeType: file.type || "image/png",
          contentBase64,
          actor: actor.actorName,
          actorId: actor.actorId,
          actorName: actor.actorName,
        });
      }
      setDraft(latest);
      onUpdated(latest);
      notify("Attachment added");
    } catch (reason) {
      notify(reason instanceof Error ? reason.message : "Unable to upload image", "error");
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = async (attachmentId: string) => {
    try {
      const updated = await api.tasks.removeAttachment(draft.id, attachmentId);
      setDraft(updated);
      onUpdated(updated);
    } catch (reason) {
      notify(reason instanceof Error ? reason.message : "Unable to remove attachment", "error");
    }
  };

  const assigneeOptions = Array.from(new Set([...assignees, draft.assignee, "Unassigned"])).filter(Boolean);

  return (
    <div className="fixed inset-0 z-[80] flex justify-end">
      <button type="button" className="absolute inset-0 bg-ink-950/45 backdrop-blur-sm" onClick={onClose} aria-label="Close task details" />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`${draft.projectName} · ${draft.title}`}
        className="relative flex h-full w-full max-w-3xl flex-col bg-paper shadow-card"
      >
        <header className="border-b border-ink-100 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{draft.projectName}</p>
              <Input
                value={draft.title}
                onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                onBlur={() => {
                  if (draft.title.trim() && draft.title !== task?.title) {
                    void persist({ title: draft.title.trim() });
                  }
                }}
                className="mt-2 border-transparent bg-transparent px-0 font-display text-xl text-ink-950 focus:border-ink-100"
              />
            </div>
            <Button variant="ghost" onClick={onClose} aria-label="Close dialog">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label="Status">
              <Select
                value={draft.status}
                onChange={(event) => {
                  const status = event.target.value as TaskStatus;
                  setDraft({ ...draft, status });
                  void persist({ status });
                }}
              >
                {TASK_COLUMNS.map((column) => (
                  <option key={column.id} value={column.id}>
                    {column.title}
                  </option>
                ))}
              </Select>
              <p className="mt-1.5 flex items-center gap-1 text-[11px] text-slate-400">
                <Clock3 className="h-3 w-3" />
                {timeInCurrentColumn(draft)} in this column
              </p>
            </Field>
            <Field label="Assignee">
              <Select
                value={draft.assignee}
                onChange={(event) => {
                  const assignee = event.target.value;
                  setDraft({ ...draft, assignee });
                  void persist({ assignee });
                }}
              >
                {assigneeOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </header>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          <section>
            <Field label="Description">
              <Textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                onBlur={() => void saveDescription()}
                placeholder="Write the requirement, bug report, or acceptance criteria..."
                className="min-h-36"
              />
            </Field>
          </section>

          <section className="grid gap-3 sm:grid-cols-3">
            <Field label="Due date">
              <div className="relative">
                <CalendarClock className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  type="date"
                  value={draft.dueDate}
                  onChange={(event) => {
                    const dueDate = event.target.value;
                    setDraft({ ...draft, dueDate });
                    void persist({ dueDate });
                  }}
                  className="pl-9"
                />
              </div>
            </Field>
            <Field label="Estimated hours">
              <Input
                type="number"
                min={0}
                step={0.25}
                value={draft.estimatedHours}
                onChange={(event) => setDraft({ ...draft, estimatedHours: Number(event.target.value) })}
                onBlur={() => void persist({ estimatedHours: draft.estimatedHours })}
              />
            </Field>
            <Field label="Time spent (hours)">
              <Input
                type="number"
                min={0}
                step={0.25}
                value={draft.spentHours}
                onChange={(event) => setDraft({ ...draft, spentHours: Number(event.target.value) })}
                onBlur={() => void persist({ spentHours: draft.spentHours })}
              />
            </Field>
          </section>

          <section>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Attachments</p>
              <label className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-aqua-700">
                <Paperclip className="h-4 w-4" />
                {uploading ? "Uploading..." : "Upload image"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/gif,image/webp"
                  multiple
                  className="sr-only"
                  disabled={uploading}
                  onChange={(event) => {
                    void onFiles(event.target.files);
                    event.target.value = "";
                  }}
                />
              </label>
            </div>
            {(draft.attachments ?? []).length === 0 ? (
              <p className="rounded-2xl border border-dashed border-ink-100 px-4 py-6 text-sm text-slate-500">
                Drop bug screenshots or UI references here. Images are stored with the task in MongoDB.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {(draft.attachments ?? []).map((attachment) => (
                  <figure key={attachment.id} className="overflow-hidden rounded-2xl border border-ink-100 bg-white">
                    <img src={resolveApiUrl(attachment.url)} alt={attachment.name} className="h-36 w-full object-cover" />
                    <figcaption className="flex items-center justify-between gap-2 px-3 py-2">
                      <span className="truncate text-xs text-slate-600">{attachment.name}</span>
                      <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => void removeAttachment(attachment.id)} aria-label="Remove attachment">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </figcaption>
                  </figure>
                ))}
              </div>
            )}
          </section>

          <TaskActivityFeed
            task={draft}
            saving={saving}
            onUpdated={(updated) => {
              setDraft(updated);
              onUpdated(updated);
            }}
          />
        </div>
      </aside>
    </div>
  );
}
