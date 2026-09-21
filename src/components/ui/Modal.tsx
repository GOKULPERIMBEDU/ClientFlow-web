import { cn } from "@/lib/cn";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "./Button";

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

export function Modal({ open, title, onClose, children, className }: ModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink-950/50 p-4 backdrop-blur-sm">
      <div className={cn("mt-10 w-full max-w-lg rounded-2xl bg-paper p-6 shadow-card", className)}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl text-ink-950">{title}</h2>
          <Button variant="ghost" onClick={onClose} aria-label="Close dialog">
            <X className="h-4 w-4" />
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}
