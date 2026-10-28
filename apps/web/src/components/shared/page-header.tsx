import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: PageHeaderProps) {
  return (
    <div className="flex items-end justify-between gap-6">
      <div>
        {eyebrow && (
          <p className="text-sm font-medium text-zinc-500">
            {eyebrow}
          </p>
        )}

        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          {title}
        </h1>

        {description && (
          <p className="mt-2 text-sm text-zinc-500">
            {description}
          </p>
        )}
      </div>

      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}