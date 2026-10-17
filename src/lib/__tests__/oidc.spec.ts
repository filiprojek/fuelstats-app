import { describe, it, expect, beforeEach, vi } from 'vitest'

const apiMock = vi.hoisted(() => ({ get: vi.fn() }))
vi.mock('@/lib/api', () => ({ default: apiMock }))

import { fetchProviders, providerStartUrl, parseAuthHash, oidcErrorMessage } from '@/lib/oidc'

describe('oidc helpers', () => {
  beforeEach(() => {
    apiMock.get.mockReset()
  })

  describe('fetchProviders', () => {
    it('returns the configured providers', async () => {
      apiMock.get.mockResolvedValue({ data: [{ id: 'authelia', name: 'Authelia' }] })
      await expect(fetchProviders()).resolves.toEqual([{ id: 'authelia', name: 'Authelia' }])
      expect(apiMock.get).toHaveBeenCalledWith('/auth/providers')
    })

    it('returns an empty list when the server does not support SSO', async () => {
      apiMock.get.mockRejectedValue(new Error('404'))
      await expect(fetchProviders()).resolves.toEqual([])
    })

    it('ignores malformed responses', async () => {
      apiMock.get.mockResolvedValue({ data: '<html>' })
      await expect(fetchProviders()).resolves.toEqual([])
    })
  })

  describe('providerStartUrl', () => {
    it('builds the start url from VITE_API', () => {
      expect(providerStartUrl('authelia')).toBe('http://api.test/api/v1/auth/oidc/authelia/start')
    })

    it('appends an encoded link token', () => {
      expect(providerStartUrl('authelia', 'a.b+c')).toBe('http://api.test/api/v1/auth/oidc/authelia/start?link=a.b%2Bc')
    })
  })

  describe('parseAuthHash', () => {
    it('parses token, error and linked values', () => {
      expect(parseAuthHash('#token=abc.def')).toEqual({ token: 'abc.def' })
      expect(parseAuthHash('#error=invalid_state')).toEqual({ error: 'invalid_state' })
      expect(parseAuthHash('#linked=authelia')).toEqual({ linked: 'authelia' })
    })

    it('returns an empty object for an empty hash', () => {
      expect(parseAuthHash('')).toEqual({})
      expect(parseAuthHash('#')).toEqual({})
    })
  })

  describe('oidcErrorMessage', () => {
    it('explains known codes', () => {
      expect(oidcErrorMessage('account_exists_unverified')).toMatch(/password/i)
      expect(oidcErrorMessage('identity_in_use')).toMatch(/another/i)
    })

    it('falls back to a generic message', () => {
      expect(oidcErrorMessage('something_new')).toBe('Single sign-on failed. Please try again.')
    })
  })
})
