import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { api, type UploadedFile } from "@/lib/api";
import { Upload } from "lucide-react";
import { useRef, useState, type DragEvent } from "react";

interface AttachmentPopoverProps {
  onInsert: (file: UploadedFile) => void;
  onError: (message: string) => void;
}

function guessMime(url: string): string {
  const clean = url.split("?")[0]?.toLowerCase() ?? "";
  if (/\.png$/.test(clean)) return "image/png";
  if (/\.jpe?g$/.test(clean)) return "image/jpeg";
  if (/\.gif$/.test(clean)) return "image/gif";
  if (/\.webp$/.test(clean)) return "image/webp";
  if (/\.pdf$/.test(clean)) return "application/pdf";
  return "application/octet-stream";
}

function nameFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return decodeURIComponent(parsed.pathname.split("/").pop() || "Linked file");
  } catch {
    return url.split("/").pop() || "Linked file";
  }
}

export function AttachmentPopover({ onInsert, onError }: AttachmentPopoverProps) {
  const [tab, setTab] = useState<"file" | "link">("file");
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFiles = async (files: FileList | File[] | null) => {
    if (!files?.length) {
      return;
    }
    setBusy(true);
    try {
      for (const file of Array.from(files)) {
        const uploaded = await api.uploads.create(file);
        onInsert(uploaded);
      }
    } catch (reason) {
      onError(reason instanceof Error ? reason.message : "Unable to upload file");
    } finally {
      setBusy(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragging(false);
    void uploadFiles(event.dataTransfer.files);
  };

  const insertLink = () => {
    const url = link.trim();
    if (!url) {
      onError("Paste a file or image URL");
      return;
    }
    try {
      new URL(url);
    } catch {
      onError("Enter a valid URL");
      return;
    }
    const now = new Date().toISOString();
    onInsert({
      id: crypto.randomUUID(),
      name: nameFromUrl(url),
      mimeType: guessMime(url),
      size: 0,
      url,
      uploadedAt: now,
    });
    setLink("");
  };

  return (
    <div className="w-80 overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-card">
      <div className="flex border-b border-ink-100">
        {(["file", "link"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={`flex-1 px-3 py-2 text-sm font-semibold capitalize ${
              tab === item ? "border-b-2 border-aqua-600 text-aqua-800" : "text-slate-500 hover:text-ink-800"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {tab === "file" ? (
        <div className="space-y-3 p-3">
          <label
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-3 py-6 text-center ${
              dragging ? "border-aqua-600 bg-aqua-50" : "border-ink-100 bg-ink-50/60"
            }`}
          >
            <Upload className="mb-2 h-5 w-5 text-slate-400" />
            <span className="text-sm font-semibold text-ink-800">Drop files to attach</span>
            <span className="mt-1 text-xs text-slate-500">Images, PDFs, and Office docs up to 8 MB</span>
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp,application/pdf,.doc,.docx,.xls,.xlsx,.txt"
              className="sr-only"
              multiple
              onChange={(event) => void uploadFiles(event.target.files)}
            />
          </label>
          <Button className="w-full" disabled={busy} onClick={() => inputRef.current?.click()}>
            {busy ? "Uploading..." : "Upload"}
          </Button>
        </div>
      ) : (
        <div className="space-y-3 p-3">
          <Input
            value={link}
            onChange={(event) => setLink(event.target.value)}
            placeholder="https://..."
            aria-label="File or image URL"
          />
          <Button className="w-full" onClick={insertLink}>
            Insert link
          </Button>
        </div>
      )}
    </div>
  );
}
