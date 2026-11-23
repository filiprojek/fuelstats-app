import { describe, it, expect } from 'vitest'
import { serviceTaskKey } from '@/lib/serviceTracker'

describe('serviceTaskKey', () => {
  it('uses _id, falling back to id', () => {
    expect(serviceTaskKey({ _id: 't1', id: 'other', name: 'Engine oil' })).toBe('t1')
    expect(serviceTaskKey({ id: 't2', name: 'Brakes' })).toBe('t2')
  })

  it('is empty for a task without either id', () => {
    expect(serviceTaskKey({ name: 'Unsaved' })).toBe('')
  })
})
