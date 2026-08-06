export function StationCardSkeleton() {
  return (
    <div className="glass-card p-6 flex flex-col gap-6 animate-pulse select-none">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-6 w-32 rounded bg-surface-hover" />
          <div className="h-4 w-20 rounded bg-surface-hover" />
        </div>
        <div className="h-6 w-24 rounded-full bg-surface-hover" />
      </div>

      {/* Main Stats / Status block */}
      <div className="flex-1 py-4 flex flex-col justify-center">
        <div className="h-8 w-24 rounded bg-surface-hover mx-auto" />
      </div>

      {/* Footer Info & Action */}
      <div className="flex items-center justify-between border-t border-surface-border pt-4">
        <div className="h-4 w-16 rounded bg-surface-hover" />
        <div className="h-9 w-28 rounded-xl bg-surface-hover" />
      </div>
    </div>
  );
}
