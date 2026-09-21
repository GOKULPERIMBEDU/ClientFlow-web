import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { env } from "@/lib/env";

interface ApiErrorProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ApiError({ message, onRetry, className }: ApiErrorProps) {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900",
        className,
      )}
    >
      <p>{message}</p>
      {env.apiBaseUrl ? (
        <p className="mt-1 text-xs text-amber-800/80">Endpoint: {env.apiBaseUrl}</p>
      ) : (
        <p className="mt-1 text-xs text-amber-800/80">
          Set VITE_API_BASE_URL in your environment and try again.
        </p>
      )}
      {onRetry ? (
        <Button variant="ghost" className="mt-2 h-auto px-0 py-0 text-xs text-amber-950" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}
