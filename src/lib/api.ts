import axios from "axios"
import { useAuthStore } from "@/stores/auth"

const api = axios.create({
  baseURL: import.meta.env.VITE_API,
  withCredentials: true,
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const url: string | undefined = error.config?.url
    const isAuthEndpoint = url?.includes("/auth/signin") || url?.includes("/auth/signup")
    if (error.response?.status === 401 && !isAuthEndpoint) {
      const auth = useAuthStore()
      auth.clear()
      localStorage.removeItem("token")

      // avoid redirect loop
      const { default: router } = await import("@/router")
      const name = router.currentRoute.value.name
      console.log(name)

      if (name !== "login" && name !== "signup") {
        router.push("/login")
      }
    }

    return Promise.reject(error)
  }
)

export default api


