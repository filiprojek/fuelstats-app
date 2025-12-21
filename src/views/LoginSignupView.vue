<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { reactive, ref } from 'vue'
import axios from 'axios'
import IconLabelButton from '@/components/IconLabelButton.vue'
import TextInput from '@/components/TextInput.vue'
import AppDialog from '@/components/AppDialog.vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/lib/api'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const loginData = reactive({
  email: '',
  username: '',
  password: '',
})

type DialogStyle = 'success' | 'danger' | 'warning' | 'info'

const dialogOpen = ref(false)
const dialogTitle = ref('')
const dialogDesc = ref('')
const dialogStyle = ref<DialogStyle>('info')

let hideTimer: number | undefined

function showDialog(style: DialogStyle, title: string, description = '', autoHideMs = 3500) {
  dialogStyle.value = style
  dialogTitle.value = title
  dialogDesc.value = description
  dialogOpen.value = true

  if (hideTimer) window.clearTimeout(hideTimer)
  if (autoHideMs > 0) {
    hideTimer = window.setTimeout(() => {
      dialogOpen.value = false
    }, autoHideMs)
  }
}

/**
 * Fetch user profile and put it into the store.
 */
async function loadUserIntoStore() {
  const res = await api.get('/user/me')
  auth.setUser(res.data)
}

function getAxiosMessage(e: unknown, fallback: string) {
  if (axios.isAxiosError(e)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (e.response?.data as any)?.message ?? (e.response?.data as any)?.error ?? fallback
  }
  return e instanceof Error ? e.message : fallback
}

async function login() {
  try {
    await api.post('/auth/signin', {
      email: loginData.email,
      password: loginData.password,
    })

    await loadUserIntoStore()
    showDialog('success', "You're logged in", '', 500)
    window.setTimeout(() => router.push('/'), 500)
  } catch (err) {
    const msg = getAxiosMessage(err, 'Login failed')
    showDialog('danger', 'Login error', msg, 5000)
  }
}

async function signup() {
  try {
    await api.post('/auth/signup', {
      username: loginData.username,
      email: loginData.email,
      password: loginData.password,
    })

    showDialog('success', 'Account created', 'You can log in now.', 1200)
    window.setTimeout(() => router.push('/login'), 1200)
  } catch (err) {
    const msg = getAxiosMessage(err, 'Signup failed')
    showDialog('danger', 'Signup error', msg, 5000)
  }
}
</script>

<template>
  <!-- Notification -->
  <Transition name="toast" appear>
    <AppDialog v-if="dialogOpen" :title="dialogTitle" :description="dialogDesc" :variant="dialogStyle" />
  </Transition>

  <form v-if="route.path === '/login'">
    <img src="/app_icon.png" alt="Fuel Stats logo" />
    <h2>Login to Fuel Stats</h2>

    <TextInput v-model="loginData.email" id="email" type="email" placeholder="Email" />
    <TextInput v-model="loginData.password" id="password" type="password" placeholder="Password" />

    <IconLabelButton @click="login" id="btn-login" label="Log In" icon="login" inline elevated />
    <RouterLink to="/signup">Don't have an account? Sign up</RouterLink>
  </form>

  <form v-else-if="route.path === '/signup'">
    <img src="/app_icon.png" alt="Fuel Stats logo" />
    <h2>Create your Fuel Stats account</h2>

    <TextInput v-model="loginData.username" id="username" type="text" placeholder="Username" />
    <TextInput v-model="loginData.email" id="email" type="email" placeholder="Email" />
    <TextInput v-model="loginData.password" id="password" type="password" placeholder="Password" />

    <IconLabelButton @click="signup" id="btn-signup" label="Sign Up" icon="person_add" inline elevated />
    <RouterLink to="/login">Already have an account? Log in</RouterLink>
  </form>
</template>

<style lang="scss" scoped>
img {
  width: 8rem;
  border-radius: var(--radius-md);
}

form {
  margin-top: 4rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: var(--space-md);

  width: 100%;
  max-width: 22rem;
  margin-left: auto;
  margin-right: auto;

  :deep(.text-input) {
    width: 100%;
  }

  :deep(.text-input input) {
    width: 100%;
    height: 2.5rem;
  }
}

#btn-login {
  background-color: var(--color-success);
}

#btn-signup {
  background-color: var(--color-primary);
}
</style>

<!-- Transition classes must NOT be scoped to a different SFC.
     Here it's in the same SFC as the Transition, so it's fine. -->
<style lang="scss">
.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 180ms ease,
    transform 180ms ease,
    filter 180ms ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.98);
  filter: blur(2px);
}

.toast-enter-to,
.toast-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
  filter: blur(0);
}
</style>
