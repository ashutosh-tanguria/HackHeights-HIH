export function cn(
  ...classes: Array<string | false | null | undefined>
) {
  return classes.filter(Boolean).join(" ");
}

export function formatPercentage(value: number | null) {
  if (value === null) {
    return "--";
  }

  return `${Math.round(value)}%`;
}

export function formatDuration(
  milliseconds: number | null | undefined,
) {
  if (milliseconds === null || milliseconds === undefined) {
    return "--";
  }

  if (milliseconds < 1000) {
    return `${milliseconds}ms`;
  }

  return `${(milliseconds / 1000).toFixed(2)}s`;
}