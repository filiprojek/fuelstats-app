export type MileageReading = { mileage: number; time: number }

type MileageRecord = { mileage: number; date?: string | null; createdAt: string }

/** Odometer readings from any record type, sorted by time; invalid values are dropped. */
export function toReadings(records: MileageRecord[]): MileageReading[] {
  return records
    .map((r) => ({ mileage: r.mileage, time: new Date(r.date || r.createdAt).getTime() }))
    .filter((r) => Number.isFinite(r.mileage) && r.mileage > 0 && Number.isFinite(r.time))
    .sort((a, b) => a.time - b.time || a.mileage - b.mileage)
}

/**
 * Kilometers driven from `cutoff` (ms timestamp, null = all time) to the latest reading.
 * The mileage at the cutoff is interpolated between the readings around it.
 * Returns null when it can't be determined.
 */
export function distanceSince(readings: MileageReading[], cutoff: number | null): number | null {
  if (readings.length < 2) return null

  const first = readings[0]!
  const last = readings[readings.length - 1]!
  let start = first.mileage

  if (cutoff !== null) {
    const idx = readings.findIndex((r) => r.time >= cutoff)
    if (idx === -1) return 0
    if (idx > 0) {
      const prev = readings[idx - 1]!
      const next = readings[idx]!
      start = prev.mileage + ((next.mileage - prev.mileage) * (cutoff - prev.time)) / (next.time - prev.time)
    }
  }

  const dist = last.mileage - start
  return dist < 0 ? null : Math.round(dist)
}
