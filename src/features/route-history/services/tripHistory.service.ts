import { requestJson, ApiError } from '../../../shared/api/request';
import { apiConfig } from '../../../shared/api/config';
import { Trip } from '../../../shared/types/models';
import { formatDatesParam } from '../utils/formatDatesParam';

type DateRangeMode = '6h' | '12h' | '1day' | 'custom';

export async function getTripHistory(
  imei: string,
  mode: DateRangeMode,
  range: { start: Date; end: Date },
  signal?: AbortSignal
): Promise<Trip[]> {
  const dates = formatDatesParam(mode, range);
  const path = `${apiConfig.tripHistoryPath}/${imei}?dates=${encodeURIComponent(dates)}`;
 console.log('Fetching trip history from:', path);
  try {
    const data = await requestJson(path, { signal });
    return (data as Trip[]) ?? [];
  } catch (err) {
    // Per spec: 404 means "no trips in this range" — an empty state, not an error.
    if (err instanceof ApiError && err.status === 404) {
      return [];
    }
    throw err; // 400 / 401 / 403 / 502 / 503 propagate for the screen to branch on
  }
}