import { AlertCircle } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center rounded-2xl border border-dashed border-surface-border bg-surface-card/40 p-8 text-center animate-in">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-border text-surface-muted mb-4">
        {icon ?? <AlertCircle className="h-6 w-6" />}
      </div>
      <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
      <p className="text-sm text-surface-muted max-w-sm mb-6">{description}</p>
      {action}
    </div>
  );
}
