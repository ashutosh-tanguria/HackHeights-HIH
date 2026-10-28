import type { HTMLAttributes } from "react";

type SeparatorProps = HTMLAttributes<HTMLDivElement>;

export function Separator({
  className = "",
  ...props
}: SeparatorProps) {
  return (
    <div
      role="separator"
      className={`h-px w-full bg-zinc-200 ${className}`}
      {...props}
    />
  );
}