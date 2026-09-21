import { AttachmentPopover } from "@/components/tasks/AttachmentPopover";
import { CommentAttachment } from "@/components/tasks/CommentAttachment";
import { MentionList, type MentionListHandle } from "@/components/tasks/MentionList";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { formatDateTime } from "@/lib/format";
import type { UploadedFile } from "@/lib/api";
import type { TeamMember } from "@/types/domain";
import Image from "@tiptap/extension-image";
import Mention from "@tiptap/extension-mention";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, ReactRenderer, useEditor } from "@tiptap/react";
import type { SuggestionOptions, SuggestionProps } from "@tiptap/suggestion";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Italic, List, ListOrdered, Paperclip } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface TaskCommentEditorProps {
  members: TeamMember[];
  saving?: boolean;
  onSave: (payload: { content: string; mentions: string[] }) => Promise<void> | void;
  onCancel: () => void;
}

function extractMentions(html: string): string[] {
  return [...new Set([...html.matchAll(/\bdata-id="([^"]+)"/gi)].map((match) => match[1] ?? "").filter(Boolean))];
}

function isEmptyComment(html: string): boolean {
  const text = html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").trim();
  return !text && !/<img\b/i.test(html) && !/comment-attachment/i.test(html);
}

function mentionSuggestion(membersRef: { current: TeamMember[] }): Omit<SuggestionOptions, "editor"> {
  return {
    char: "@",
    items: ({ query }) =>
      membersRef.current
        .filter((member) => `${member.name} ${member.email}`.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 8)
        .map((member) => ({ ...member, label: member.name })),
    render: () => {
      let component: ReactRenderer<MentionListHandle> | null = null;
      let popup: HTMLDivElement | null = null;

      const place = (props: SuggestionProps) => {
        const rect = props.clientRect?.();
        if (!popup || !rect) {
          return;
        }
        popup.style.left = `${rect.left}px`;
        popup.style.top = `${rect.bottom + 6}px`;
      };

      return {
        onStart: (props) => {
          component = new ReactRenderer(MentionList, {
            props,
            editor: props.editor,
          });
          popup = document.createElement("div");
          popup.style.position = "fixed";
          popup.style.zIndex = "95";
          popup.appendChild(component.element);
          document.body.appendChild(popup);
          place(props);
        },
        onUpdate: (props) => {
          component?.updateProps(props);
          place(props);
        },
        onKeyDown: (props) => {
          if (props.event.key === "Escape") {
            popup?.remove();
            return true;
          }
          return component?.ref?.onKeyDown(props) ?? false;
        },
        onExit: () => {
          popup?.remove();
          popup = null;
          component?.destroy();
          component = null;
        },
      };
    },
  };
}

export function TaskCommentEditor({ members, saving, onSave, onCancel }: TaskCommentEditorProps) {
  const { notify } = useToast();
  const membersRef = useRef(members);
  membersRef.current = members;
  const popoverRef = useRef<HTMLDivElement>(null);
  const attachBtnRef = useRef<HTMLDivElement>(null);
  const [attachOpen, setAttachOpen] = useState(false);
  const [attachPos, setAttachPos] = useState<{ top: number; left: number } | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        blockquote: false,
      }),
      Image.configure({ inline: false, allowBase64: true }),
      CommentAttachment,
      Placeholder.configure({
        placeholder: "Type @ to mention and notify someone",
      }),
      Mention.configure({
        HTMLAttributes: { class: "mention" },
        suggestion: mentionSuggestion(membersRef),
      }),
    ],
    editorProps: {
      attributes: {
        class: "tiptap min-h-[7rem] px-3 py-2 text-sm text-ink-900 outline-none",
      },
    },
  });

  useEffect(() => {
    return () => editor?.destroy();
  }, [editor]);

  useEffect(() => {
    if (!attachOpen) {
      return;
    }
    const close = (event: MouseEvent) => {
      const target = event.target as Node;
      if (popoverRef.current?.contains(target) || attachBtnRef.current?.contains(target)) {
        return;
      }
      setAttachOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [attachOpen]);

  const insertUploaded = (file: UploadedFile) => {
    editor
      ?.chain()
      .focus()
      .insertCommentAttachment({
        id: file.id,
        src: file.url,
        name: file.name,
        mimeType: file.mimeType,
        uploadedAt: file.uploadedAt,
        size: file.size,
        label: formatDateTime(file.uploadedAt),
      })
      .run();
    setAttachOpen(false);
  };

  const clear = () => {
    editor?.commands.clearContent();
    onCancel();
  };

  const save = async () => {
    if (!editor) {
      return;
    }
    const content = editor.getHTML();
    if (isEmptyComment(content)) {
      return;
    }
    await onSave({ content, mentions: extractMentions(content) });
    editor.commands.clearContent();
  };

  const html = editor?.getHTML() ?? "";
  const empty = isEmptyComment(html);

  return (
    <div className="rounded-2xl border border-ink-100 bg-white">
      <div className="flex flex-wrap items-center gap-1 border-b border-ink-100 px-2 py-1.5">
        <ToolbarButton
          label="Bold"
          active={editor?.isActive("bold")}
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Italic"
          active={editor?.isActive("italic")}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Bullet list"
          active={editor?.isActive("bulletList")}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Numbered list"
          active={editor?.isActive("orderedList")}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <div className="relative" ref={attachBtnRef}>
          <ToolbarButton
            label="Attach file or image"
            active={attachOpen}
            onClick={() => {
              const rect = attachBtnRef.current?.getBoundingClientRect();
              if (!rect) {
                setAttachPos({ top: 120, left: 24 });
              } else {
                const width = 320;
                const height = 280;
                const left = Math.min(Math.max(12, rect.left), window.innerWidth - width - 12);
                const top = rect.top - height - 8 < 12 ? rect.bottom + 8 : rect.top - height - 8;
                setAttachPos({ top, left });
              }
              setAttachOpen((open) => !open);
            }}
          >
            <Paperclip className="h-4 w-4" />
          </ToolbarButton>
        </div>
        {attachOpen && attachPos
          ? createPortal(
              <div
                ref={popoverRef}
                className="fixed z-[80]"
                style={{ top: attachPos.top, left: attachPos.left }}
              >
                <AttachmentPopover
                  onInsert={insertUploaded}
                  onError={(message) => notify(message, "error")}
                />
              </div>,
              document.body,
            )
          : null}
      </div>
      <EditorContent editor={editor} />
      <div className="flex justify-end gap-2 border-t border-ink-100 px-3 py-2">
        <Button variant="secondary" onClick={clear} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={() => void save()} disabled={saving || empty || !editor}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}

function ToolbarButton({
  children,
  label,
  active,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`rounded-lg p-1.5 ${active ? "bg-aqua-50 text-aqua-800" : "text-slate-500 hover:bg-ink-50 hover:text-ink-800"}`}
    >
      {children}
    </button>
  );
}
