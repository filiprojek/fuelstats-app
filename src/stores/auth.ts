import { defineStore } from 'pinia'
import { ref } from 'vue'

export type LinkedIdentity = {
  provider: string
  email?: string
  linkedAt?: string
}

export type User = {
  id: number | string
  email: string
  username: string
  hasPassword?: boolean
  identities?: LinkedIdentity[]
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
