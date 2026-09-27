export function formatJoinedDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) {
    return '0';
  }

  const normalized = Math.max(0, value);

  if (normalized < 1000) return String(Math.round(normalized));

  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: normalized < 10_000 ? 1 : 0,
  }).format(normalized);
}
