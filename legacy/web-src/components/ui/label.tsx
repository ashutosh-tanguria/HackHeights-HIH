import type { LabelHTMLAttributes } from "react";

type LabelProps = LabelHTMLAttributes<HTMLLabelElement>;

export function Label({
  className = "",
  ...props
}: LabelProps) {
  return (
    <label
      className={`mb-2 block text-sm font-medium text-zinc-900 ${className}`}
      {...props}
    />
  );
}