import { cn } from "@/lib/cn";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-aqua-600 text-white hover:bg-aqua-700 shadow-sm disabled:bg-aqua-600/50",
  secondary:
    "bg-white text-ink-900 border border-ink-100 hover:bg-ink-50 disabled:opacity-50",
  ghost: "text-ink-700 hover:bg-ink-50",
  danger: "bg-rose-600 text-white hover:bg-rose-700",
};

export function Button({ className, variant = "primary", type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition disabled:cursor-not-allowed",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
