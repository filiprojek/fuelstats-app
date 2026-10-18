<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/lib/api'
import { useAuthStore } from '@/stores/auth'
import { parseAuthHash } from '@/lib/oidc'
import { clearToken, setToken } from '@/lib/session'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

onMounted(async () => {
  const { token, error, remember } = parseAuthHash(route.hash)

  if (!token) {
    await router.replace({ path: '/login', hash: `#error=${error ?? 'sso_failed'}` })
    return
  }

  setToken(token, remember === true)
  try {
    const res = await api.get('/user/me')
    auth.setUser(res.data)
    await router.replace('/')
  } catch {
    clearToken()
    auth.clear()
    await router.replace({ path: '/login', hash: '#error=sso_failed' })
  }
})
</script>

<template>
  <div class="auth-callback">
    <img src="/app_icon.png" alt="Fuel Stats logo" />
    <p>Signing you in…</p>
  </div>
</template>

<style lang="scss" scoped>
.auth-callback {
  margin-top: 6rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
  color: var(--text-secondary);
}

img {
  width: 6rem;
  border-radius: var(--radius-md);
}
</style>
