import { defineStore } from 'pinia'
import { ref } from 'vue'

type User = {
  id: number
  email: string
  username: string
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const initialized = ref(false)

  function setUser(u: User) {
    user.value = u
    initialized.value = true
  }

  function clear() {
    user.value = null
    initialized.value = true
  }

  return { user, initialized, setUser, clear }
})
