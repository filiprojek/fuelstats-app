import { describe, it, expect } from 'vitest'
import { FUEL_TYPES, SERVICE_TYPES } from '@/lib/constants'

describe('constants', () => {
  it.each([
    ['FUEL_TYPES', FUEL_TYPES],
    ['SERVICE_TYPES', SERVICE_TYPES],
  ])('%s has unique values and labels', (_name, list) => {
    const values = list.map((o) => o.value)
    expect(new Set(values).size).toBe(values.length)
    expect(list.every((o) => o.label.length > 0)).toBe(true)
  })

  it('offers an "other" fallback in both lists', () => {
    expect(FUEL_TYPES.some((f) => f.value === 'other')).toBe(true)
    expect(SERVICE_TYPES.some((s) => s.value === 'other')).toBe(true)
  })
})
