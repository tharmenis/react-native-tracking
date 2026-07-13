const timestampFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export function formatTimestamp(value: unknown, fallback: string) {
  if (value === null || value === undefined) {
    return fallback;
  }

  const raw = typeof value === 'string' ? value.trim() : `${value}`.trim();

  if (!raw) {
    return fallback;
  }

  const parsed = typeof value === 'number' ? new Date(value) : new Date(raw);

  if (Number.isNaN(parsed.getTime())) {
    return raw;
  }

  return timestampFormatter.format(parsed);
}