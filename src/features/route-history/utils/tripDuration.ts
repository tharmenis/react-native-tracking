
export function getTripDurationMin(trip: { startTime: number; endTime: number }): number {
  return Math.round((trip.endTime - trip.startTime) / 60_000);
}