type StatCardProps = {
  label: string;
  value: string | number;
  description?: string;
};

export function StatCard({
  label,
  value,
  description,
}: StatCardProps) {
  return (
    <div className="rounded-xl border bg-white p-5">
      <p className="text-sm font-medium text-zinc-500">
        {label}
      </p>

      <p className="mt-3 text-3xl font-semibold tracking-tight">
        {value}
      </p>

      {description && (
        <p className="mt-1 text-xs text-zinc-400">
          {description}
        </p>
      )}
    </div>
  );
}