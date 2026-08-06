import { AlertOctagon, RotateCcw } from "lucide-react";

interface ErrorStateProps {
  title?: string;
  description?: string;
  error?: Error;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Something went wrong",
  description = "Failed to load data from server. Please check your connection.",
  error,
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-danger/20 bg-danger/5 p-8 text-center animate-in">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-danger/10 text-danger mb-4 shadow-glow-danger">
        <AlertOctagon className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
      <p className="text-sm text-surface-muted max-w-sm mb-6">
        {error?.message || description}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-xl bg-surface-hover hover:bg-surface-border border border-surface-border px-4 py-2 text-sm font-medium text-white transition-colors"
        >
          <RotateCcw className="h-4 w-4" />
          Retry
        </button>
      )}
    </div>
  );
}
