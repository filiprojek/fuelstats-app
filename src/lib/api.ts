import axios from 'axios'
import { useAuthStore } from '@/stores/auth'
import { clearToken, getToken } from '@/lib/session'

const api = axios.create({
  baseURL: import.meta.env.VITE_API,
  withCredentials: true,
})

api.interceptors.request.use(
  (config) => {
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const url: string | undefined = error.config?.url
    const isAuthEndpoint = url?.includes('/auth/signin') || url?.includes('/auth/signup')
    if (error.response?.status === 401 && !isAuthEndpoint) {
      const auth = useAuthStore()
      auth.clear()
      clearToken()

      // only leave protected pages; public pages (login, signup, SSO callback) and the
      // initial session check before the first navigation are handled by the router guard
      const { default: router } = await import('@/router')
      if (router.currentRoute.value.meta?.requiresAuth) {
        router.push('/login')
      }
    }

    return Promise.reject(error)
  },
)

export default api
