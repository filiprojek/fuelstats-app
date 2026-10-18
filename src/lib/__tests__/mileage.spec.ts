import { describe, it, expect } from 'vitest'
import { toReadings, distanceSince } from '@/lib/mileage'

const DAY = 86400000
const NOW = Date.UTC(2026, 9, 17, 12)
const at = (daysAgo: number, mileage: number) => ({ mileage, time: NOW - daysAgo * DAY })
const cutoff = (days: number) => NOW - days * DAY

describe('toReadings', () => {
  it('uses date or createdAt, drops invalid mileage and sorts by time', () => {
    const iso = (d: number) => new Date(NOW - d * DAY).toISOString()
    expect(
      toReadings([
        { mileage: 300, date: iso(1), createdAt: iso(50) },
        { mileage: 100, createdAt: iso(10) },
        { mileage: 0, date: iso(5), createdAt: iso(5) },
        { mileage: Number.NaN, date: iso(4), createdAt: iso(4) },
        { mileage: 200, date: 'not a date', createdAt: 'nope' },
      ]),
    ).toEqual([at(10, 100), at(1, 300)])
  })

  it('orders readings at the same time by mileage', () => {
    const d = new Date(NOW).toISOString()
    expect(toReadings([{ mileage: 20, date: d, createdAt: d }, { mileage: 10, date: d, createdAt: d }]).map((r) => r.mileage)).toEqual([10, 20])
  })
})

describe('distanceSince', () => {
  const readings = [at(400, 10000), at(100, 10500), at(10, 10900), at(2, 11400)]

  it('returns null with fewer than two readings', () => {
    expect(distanceSince([], null)).toBeNull()
    expect(distanceSince([at(1, 5)], cutoff(30))).toBeNull()
  })

  it('measures all time from the first to the latest reading', () => {
    expect(distanceSince(readings, null)).toBe(1400)
  })

  it('estimates the mileage at the period start between the surrounding readings', () => {
    // 10500 + 400 * 70/90 = 10811.1
    expect(distanceSince(readings, cutoff(30))).toBe(589)
    // 10000 + 500 * 35/300 = 10058.3
    expect(distanceSince(readings, cutoff(365))).toBe(1342)
  })

  it('starts at the first reading when the period begins before any reading', () => {
    expect(distanceSince(readings, cutoff(1000))).toBe(1400)
  })

  it('returns 0 when no reading falls into the period', () => {
    expect(distanceSince(readings, cutoff(1))).toBe(0)
  })

  it('returns null for decreasing mileage', () => {
    expect(distanceSince([at(10, 500), at(5, 400)], null)).toBeNull()
  })
})
