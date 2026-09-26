import type { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-surface/60 px-6 py-12 text-center">
      {icon && <span className="text-3xl">{icon}</span>}
      <p className="text-lg font-bold text-ink">{title}</p>
      {description && <p className="text-base text-ink-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
