type DateRangeMode = '6h' | '12h' | '1day' | 'custom';

const PRESET_MAP: Record<Exclude<DateRangeMode, 'custom'>, string> = {
  '6h': '6h',
  '12h': '12h',
  '1day': '1d',
};

const formatCustomBoundary = (date: Date) =>
  date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

/**
 * Converts the screen's internal date-range state into the string format
 * the trip-history endpoint expects for its `dates` query param.
 *
 * - Presets map to the API's short codes (e.g. '1day' -> '1d').
 * - Custom ranges are formatted to match exactly what
 *   `toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric',
 *   hour: 'numeric', minute: '2-digit' })` produces, per the API spec.
 *
 * Returns the raw (unencoded) string — URL-encoding happens where the
 * request URL is built, not here.
 */
export function formatDatesParam(
  mode: DateRangeMode,
  range: { start: Date; end: Date }
): string {
  if (mode !== 'custom') {
    return PRESET_MAP[mode];
  }

  return `${formatCustomBoundary(range.start)} - ${formatCustomBoundary(range.end)}`;
}