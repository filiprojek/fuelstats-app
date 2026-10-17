import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'

describe('auth store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('starts empty and uninitialized', () => {
    const auth = useAuthStore()
    expect(auth.user).toBeNull()
    expect(auth.initialized).toBe(false)
  })

  it('setUser stores the user and marks initialized', () => {
    const auth = useAuthStore()
    auth.setUser({ id: 1, email: 'a@b.com', username: 'a' })
    expect(auth.user).toEqual({ id: 1, email: 'a@b.com', username: 'a' })
    expect(auth.initialized).toBe(true)
  })

  it('clear removes the user but stays initialized', () => {
    const auth = useAuthStore()
    auth.setUser({ id: 1, email: 'a@b.com', username: 'a' })
    auth.clear()
    expect(auth.user).toBeNull()
    expect(auth.initialized).toBe(true)
  })
})
