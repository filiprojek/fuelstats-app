import api from '@/lib/api'

export type OidcProvider = {
  id: string
  name: string
}

export type AuthHash = {
  token?: string
  error?: string
  linked?: string
}

const ERROR_MESSAGES: Record<string, string> = {
  account_exists_unverified:
    'An account with this email already exists. Log in with your password and link the provider in Settings.',
  signup_disabled: 'Creating new accounts through this provider is disabled.',
  email_missing: 'The provider did not share your email address.',
  identity_in_use: 'This provider account is already linked to another Fuel Stats user.',
  invalid_state: 'The sign-in took too long or was interrupted. Please try again.',
  provider_unavailable: 'The sign-in provider is currently unreachable.',
  unknown_provider: 'This sign-in provider is not configured.',
  access_denied: 'Sign-in was cancelled.',
  link_expired: 'The link request expired. Please try again.',
}

/** Single sign-on providers configured on the server; empty when SSO is unavailable */
export async function fetchProviders(): Promise<OidcProvider[]> {
  try {
    const res = await api.get('/auth/providers')
    return Array.isArray(res.data) ? res.data : []
  } catch {
    return []
  }
}

/** Server endpoint that starts the provider sign-in (needs a full page navigation) */
export function providerStartUrl(providerId: string, linkToken?: string): string {
  const base = String(import.meta.env.VITE_API ?? '').replace(/\/+$/, '')
  const url = `${base}/auth/oidc/${encodeURIComponent(providerId)}/start`
  return linkToken ? `${url}?link=${encodeURIComponent(linkToken)}` : url
}

/** Parse `#token=…`, `#error=…` or `#linked=…` passed back by the server */
export function parseAuthHash(hash: string): AuthHash {
  const params = new URLSearchParams(hash.replace(/^#/, ''))
  const result: AuthHash = {}
  for (const key of ['token', 'error', 'linked'] as const) {
    const value = params.get(key)
    if (value) result[key] = value
  }
  return result
}

export function oidcErrorMessage(code: string): string {
  return ERROR_MESSAGES[code] ?? 'Single sign-on failed. Please try again.'
}

/** Full page navigation, wrapped so it can be mocked in tests */
export function redirectTo(url: string) {
  window.location.assign(url)
}
