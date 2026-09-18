"use client";

import { cn } from "@/lib/cn";
import { CircleHelp } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

interface InfoTipProps {
  title: string;
  children: string;
  className?: string;
  align?: "left" | "right";
}

export function InfoTip({ title, children, className, align = "right" }: InfoTipProps) {
  const id = useId();
  const rootRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <span ref={rootRef} className={cn("group relative inline-flex", className)}>
      <button
        type="button"
        aria-label={`About ${title}`}
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-ink-100 bg-white text-slate-500 transition hover:border-aqua-400 hover:text-aqua-700"
      >
        <CircleHelp className="h-4 w-4" />
      </button>
      <span
        id={id}
        role="tooltip"
        className={cn(
          "absolute top-full z-50 mt-2 w-64 rounded-2xl border border-ink-100 bg-ink-950 px-3 py-2.5 text-left shadow-card transition",
          align === "right" ? "right-0" : "left-0",
          open
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0 group-hover:opacity-100 group-focus-within:opacity-100",
        )}
      >
        <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-aqua-400">{title}</span>
        <span className="mt-1 block text-xs leading-relaxed text-slate-200">{children}</span>
      </span>
    </span>
  );
}

export function ActionHint({
  title,
  hint,
  align,
  children,
  className,
}: {
  title: string;
  hint: string;
  align?: "left" | "right";
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {children}
      <InfoTip title={title} align={align}>
        {hint}
      </InfoTip>
    </div>
  );
}
