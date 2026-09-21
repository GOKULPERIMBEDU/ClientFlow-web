import { resolveApiUrl } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { Copy, FileText, Trash2 } from "lucide-react";
import { useState } from "react";

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

export function CommentAttachmentView({ node, deleteNode, selected }: NodeViewProps) {
  const src = String(node.attrs.src ?? "");
  const name = String(node.attrs.name ?? "Attachment");
  const mimeType = String(node.attrs.mimeType ?? "");
  const uploadedAt = String(node.attrs.uploadedAt ?? "");
  const label = String(node.attrs.label || (uploadedAt ? formatDateTime(uploadedAt) : "Just now"));
  const href = resolveApiUrl(src);
  const [copied, setCopied] = useState(false);
  const [hovered, setHovered] = useState(false);
  const showActions = hovered || selected;

  const copy = async () => {
    await navigator.clipboard.writeText(href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };

  return (
    <NodeViewWrapper className="comment-file-node my-2" data-drag-handle>
      <div
        className={`comment-file-card ${selected ? "is-selected" : ""}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {showActions ? (
          <div className="comment-file-actions">
            <button type="button" onClick={() => void copy()} aria-label="Copy">
              <Copy className="h-3.5 w-3.5" />
              {copied ? "Copied" : "Copy"}
            </button>
            <button type="button" onClick={deleteNode} aria-label="Delete">
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          </div>
        ) : null}
        {isImageType(mimeType) ? (
          <img src={href} alt={name} className="comment-file-thumb" />
        ) : (
          <span className="comment-file-icon">
            <FileText className="h-4 w-4" />
            {fileBadge(mimeType, name)}
          </span>
        )}
        <div className="comment-file-copy">
          <div className="comment-file-name">{name}</div>
          <div className="comment-file-time">{label}</div>
        </div>
      </div>
    </NodeViewWrapper>
  );
}
