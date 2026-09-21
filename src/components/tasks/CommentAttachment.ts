import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { CommentAttachmentView } from "@/components/tasks/CommentAttachmentView";

export interface CommentAttachmentAttrs {
  id: string;
  src: string;
  name: string;
  mimeType: string;
  uploadedAt: string;
  size: number;
  label: string;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    commentAttachment: {
      insertCommentAttachment: (attrs: CommentAttachmentAttrs) => ReturnType;
    };
  }
}

function isImageType(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

function fileBadge(mimeType: string, name: string): string {
  if (mimeType === "application/pdf" || name.toLowerCase().endsWith(".pdf")) {
    return "PDF";
  }
  const extension = name.split(".").pop()?.toUpperCase();
  return extension && extension.length <= 4 ? extension : "FILE";
}

export const CommentAttachment = Node.create({
  name: "commentAttachment",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      id: { default: "" },
      src: { default: "" },
      name: { default: "Attachment" },
      mimeType: { default: "application/octet-stream" },
      uploadedAt: { default: "" },
      size: { default: 0 },
      label: { default: "" },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="comment-attachment"]',
        getAttrs: (node) => {
          if (!(node instanceof HTMLElement)) {
            return false;
          }
          return {
            id: node.getAttribute("data-file-id") ?? "",
            src: node.getAttribute("data-src") ?? "",
            name: node.getAttribute("data-name") ?? "Attachment",
            mimeType: node.getAttribute("data-mime") ?? "application/octet-stream",
            uploadedAt: node.getAttribute("data-uploaded-at") ?? "",
            size: Number(node.getAttribute("data-size") || 0),
            label: node.getAttribute("data-label") ?? "",
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const name = String(HTMLAttributes.name || "Attachment");
    const mimeType = String(HTMLAttributes.mimeType || "");
    const src = String(HTMLAttributes.src || "");
    const label = String(HTMLAttributes.label || HTMLAttributes.uploadedAt || "");
    const image = isImageType(mimeType);
    return [
      "div",
      mergeAttributes({
        "data-type": "comment-attachment",
        "data-file-id": HTMLAttributes.id,
        "data-src": src,
        "data-name": name,
        "data-mime": mimeType,
        "data-uploaded-at": HTMLAttributes.uploadedAt,
        "data-size": String(HTMLAttributes.size ?? 0),
        "data-label": label,
        class: "comment-file-card",
      }),
      image
        ? ["img", { src, alt: name, class: "comment-file-thumb" }]
        : ["span", { class: "comment-file-icon" }, fileBadge(mimeType, name)],
      [
        "div",
        { class: "comment-file-copy" },
        ["div", { class: "comment-file-name" }, name],
        ["div", { class: "comment-file-time" }, label],
      ],
    ];
  },

  addCommands() {
    return {
      insertCommentAttachment:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs }),
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(CommentAttachmentView);
  },
});
