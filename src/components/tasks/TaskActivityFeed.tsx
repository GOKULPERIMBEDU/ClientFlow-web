import { TaskCommentEditor } from "@/components/tasks/TaskCommentEditor";
import { TaskHistoryTimeline } from "@/components/tasks/TaskHistoryTimeline";
import { useToast } from "@/components/ui/Toast";
import { useTeam } from "@/context/TeamContext";
import { api, resolveApiUrl } from "@/lib/api";
import { formatDateTime, initialsFromName } from "@/lib/format";
import type { Task, TaskComment } from "@/types/domain";
import { useMemo, useState } from "react";

type ActivityTab = "comments" | "history";

interface TaskActivityFeedProps {
  task: Task;
  saving: boolean;
  onUpdated: (task: Task) => void;
}

function rewriteHtml(html: string): string {
  return html.replace(
    /(src|href|data-src)="(\/(?:api|uploads)[^"]+)"/g,
    (_full, attr: string, path: string) => `${attr}="${resolveApiUrl(path)}"`,
  );
}

function CommentCard({ comment }: { comment: TaskComment }) {
  const html = rewriteHtml(comment.content || (comment.body ? `<p>${comment.body}</p>` : ""));
  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-aqua-50 text-[11px] font-semibold text-aqua-800">
        {initialsFromName(comment.author)}
      </div>
      <div className="min-w-0 flex-1 rounded-2xl bg-ink-50/70 px-3 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-ink-900">{comment.author}</p>
          <p className="text-[11px] text-slate-400">{formatDateTime(comment.createdAt)}</p>
        </div>
        <div className="comment-html mt-1 text-sm text-slate-600" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </div>
  );
}

export function TaskActivityFeed({ task, saving, onUpdated }: TaskActivityFeedProps) {
  const { notify } = useToast();
  const { actor, members } = useTeam();
  const [tab, setTab] = useState<ActivityTab>("comments");
  const [posting, setPosting] = useState(false);
  const comments = useMemo(
    () => [...(task.comments ?? [])].sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [task.comments],
  );

  const tabs: { id: ActivityTab; label: string }[] = [
    { id: "comments", label: "Comments" },
    { id: "history", label: "History" },
  ];

  const saveComment = async ({ content, mentions }: { content: string; mentions: string[] }) => {
    setPosting(true);
    try {
      const updated = await api.tasks.addComment(task.id, {
        content,
        mentions,
        author: actor.actorName,
        actorId: actor.actorId,
      });
      onUpdated(updated);
      notify("Comment saved");
    } catch (reason) {
      notify(reason instanceof Error ? reason.message : "Unable to save comment", "error");
      throw reason;
    } finally {
      setPosting(false);
    }
  };

  return (
    <section className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Activity</p>
        <div className="mt-2 flex gap-1 border-b border-ink-100">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`-mb-px border-b-2 px-3 py-2 text-sm font-semibold transition ${
                tab === item.id ? "border-aqua-600 text-aqua-800" : "border-transparent text-slate-500 hover:text-ink-800"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "comments" ? (
        <div className="space-y-4">
          <div className="min-h-32 space-y-4">
            {comments.length === 0 ? (
              <p className="text-sm text-slate-500">No comments yet. Mention a teammate with @.</p>
            ) : (
              comments.map((comment) => <CommentCard key={comment.id} comment={comment} />)
            )}
          </div>
          <TaskCommentEditor
            members={members}
            saving={saving || posting}
            onCancel={() => undefined}
            onSave={saveComment}
          />
        </div>
      ) : (
        <TaskHistoryTimeline task={task} />
      )}
    </section>
  );
}
