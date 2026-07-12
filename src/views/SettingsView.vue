<template>
  <section id="settings">
    <h2>{{ auth.user?.username ?? '' }}</h2>
    <p>{{ auth.user?.email ?? '' }}</p>
    <IconLabelButton @click="logout" id="btn-signout" label="Sign Out" icon="logout" inline elevated />
  </section>
</template>

<script setup lang="ts">
import IconLabelButton from '@/components/IconLabelButton.vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/lib/api'

const auth = useAuthStore()

async function logout() {
  try {
    localStorage.removeItem('token')
    await api.post('/auth/signout')
    window.location.href = '/'
  } catch (err) {
    console.error(err)
    localStorage.removeItem('token')
    window.location.href = '/'
  }
}
</script>

<style lang="scss" scoped>
section#settings {
  margin: 0 var(--space-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: var(--space-md);
  height: 60vh;
}

#btn-signout {
  width: 8rem;
  background-color: var(--color-danger);
}
</style>
