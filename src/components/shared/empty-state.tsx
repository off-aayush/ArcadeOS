import { AlertCircle } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-surface-border bg-surface-card/40 p-8 text-center animate-in">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-border text-surface-muted mb-4">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
      <p className="text-sm text-surface-muted max-w-sm mb-6">{description}</p>
      {action}
    </div>
  );
}
