import axios from "axios"
import router from "@/router"
import { useAuthStore } from "@/stores/auth"

const api = axios.create({
  baseURL: import.meta.env.VITE_API,
  withCredentials: true,
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const url: string | undefined = error.config?.url
    const isAuthEndpoint = url?.includes("/auth/signin") || url?.includes("/auth/signup")
    if (error.response?.status === 401 && !isAuthEndpoint) {
      const auth = useAuthStore()
      auth.clear()

      // avoid redirect loop
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

