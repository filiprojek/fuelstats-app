<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import api from '@/lib/api'
import { useAuthStore } from '@/stores/auth'
import { fetchProviders, oidcErrorMessage, parseAuthHash, providerStartUrl, redirectTo, type OidcProvider } from '@/lib/oidc'
import IconLabelButton from '@/components/IconLabelButton.vue'
import TextInput from '@/components/TextInput.vue'

type NotifyStyle = 'success' | 'danger' | 'warning' | 'info'

const emit = defineEmits<{
  (e: 'notify', style: NotifyStyle, title: string, description: string): void
}>()

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const providers = ref<OidcProvider[]>([])
const busy = ref<string | null>(null)
const passwordForm = reactive({ current: '', next: '', confirm: '' })

const hasPassword = computed(() => !!auth.user?.hasPassword)
const identities = computed(() => auth.user?.identities ?? [])
const signInMethodCount = computed(() => identities.value.length + (hasPassword.value ? 1 : 0))

function identityFor(providerId: string) {
  return identities.value.find((i) => i.provider === providerId)
}

function providerName(providerId: string) {
  return providers.value.find((p) => p.id === providerId)?.name ?? providerId
}

function errorMessage(e: unknown, fallback: string) {
  if (axios.isAxiosError(e)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (e.response?.data as any)?.error ?? (e.response?.data as any)?.message ?? fallback
  }
  return e instanceof Error ? e.message : fallback
}

async function refreshUser() {
  const res = await api.get('/user/me')
  auth.setUser(res.data)
}

async function link(providerId: string) {
  busy.value = providerId
  try {
    const res = await api.post(`/auth/oidc/${providerId}/link`)
    redirectTo(providerStartUrl(providerId, res.data.linkToken))
  } catch (e) {
    emit('notify', 'danger', 'Could not link provider', errorMessage(e, 'Linking failed'))
  } finally {
    busy.value = null
  }
}

async function unlink(providerId: string) {
  busy.value = providerId
  try {
    await api.delete(`/user/identities/${providerId}`)
    await refreshUser()
    emit('notify', 'success', `${providerName(providerId)} unlinked`, '')
  } catch (e) {
    emit('notify', 'danger', 'Could not unlink provider', errorMessage(e, 'Unlinking failed'))
  } finally {
    busy.value = null
  }
}

async function savePassword() {
  if (passwordForm.next.length < 8) {
    emit('notify', 'warning', 'Password too short', 'Use at least 8 characters.')
    return
  }
  if (passwordForm.next !== passwordForm.confirm) {
    emit('notify', 'warning', 'Passwords do not match', '')
    return
  }

  const payload: { currentPassword?: string; newPassword: string } = { newPassword: passwordForm.next }
  if (hasPassword.value) payload.currentPassword = passwordForm.current

  try {
    await api.put('/user/password', payload)
    const wasSet = hasPassword.value
    passwordForm.current = passwordForm.next = passwordForm.confirm = ''
    await refreshUser()
    emit('notify', 'success', wasSet ? 'Password changed' : 'Password set', wasSet ? '' : 'You can now also log in with your email.')
  } catch (e) {
    emit('notify', 'danger', 'Could not update password', errorMessage(e, 'Update failed'))
  }
}

onMounted(async () => {
  providers.value = await fetchProviders()

  const { linked, error } = parseAuthHash(route.hash)
  if (linked || error) {
    router.replace({ path: route.path, hash: '' })
    if (linked) {
      const name = providerName(linked)
      emit('notify', 'success', `${name} linked`, `You can now sign in with ${name}.`)
      await refreshUser().catch(() => {})
    } else if (error) {
      emit('notify', 'danger', 'Could not link provider', oidcErrorMessage(error))
    }
  }
})
</script>

<template>
  <div class="sign-in-methods">
    <ul v-if="providers.length" class="providers">
      <li v-for="p in providers" :key="p.id" class="provider-row">
        <div class="provider-info">
          <span class="material-symbols-outlined">key</span>
          <div>
            <h3>{{ p.name }}</h3>
            <p v-if="identityFor(p.id)">Linked{{ identityFor(p.id)?.email ? ` as ${identityFor(p.id)?.email}` : '' }}</p>
            <p v-else>Not linked</p>
          </div>
        </div>

        <IconLabelButton
          v-if="identityFor(p.id)"
          class="btn-action btn-unlink"
          label="Unlink"
          icon="link_off"
          inline
          :disabled="busy !== null || signInMethodCount <= 1"
          :title="signInMethodCount <= 1 ? 'Set a password first – this is your only way to sign in' : ''"
          @click="unlink(p.id)"
        />
        <IconLabelButton v-else class="btn-action btn-link" label="Link" icon="link" inline :disabled="busy !== null" @click="link(p.id)" />
      </li>
    </ul>

    <p v-if="!hasPassword" class="hint">
      Your account has no password yet. Set a password to also log in with your email, or before unlinking your only provider.
    </p>

    <form class="password-form" @submit.prevent="savePassword">
      <h3 class="password-title">{{ hasPassword ? 'Change password' : 'Set a password' }}</h3>
      <TextInput v-if="hasPassword" v-model="passwordForm.current" id="current-password" type="password" placeholder="Current password" />
      <TextInput v-model="passwordForm.next" id="new-password" type="password" placeholder="New password" />
      <TextInput v-model="passwordForm.confirm" id="confirm-password" type="password" placeholder="Confirm new password" />
      <IconLabelButton type="submit" class="btn-action btn-save-password" :label="hasPassword ? 'Change' : 'Set password'" icon="lock" inline />
    </form>
  </div>
</template>

<style lang="scss" scoped>
.sign-in-methods {
  background-color: var(--bg-secondary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-default);
  padding: var(--space-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.providers {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.provider-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
}

.provider-info {
  display: flex;
  align-items: center;
  gap: var(--space-md);

  .material-symbols-outlined {
    font-size: 1.5rem;
    padding: var(--space-sm);
    border-radius: var(--radius-md);
    background-color: var(--bg-elevated);
    border: 1px solid var(--border-muted);
  }

  h3 {
    font-size: var(--font-size-base);
    font-weight: 650;
    margin-bottom: 2px;
  }

  p {
    font-size: 0.8rem;
    color: var(--text-secondary);
  }
}

.hint {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.password-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  border-top: 1px solid var(--border-muted);
  padding-top: var(--space-md);

  h3 {
    font-size: var(--font-size-base);
    font-weight: 650;
  }

  :deep(.text-input input) {
    width: 100%;
    height: 2.5rem;
  }
}

.btn-action {
  width: 7.5rem;
  font-size: 0.8rem;
  background-color: var(--bg-elevated);
  border: 1px solid var(--border-default);
  transition:
    background-color 150ms ease,
    border-color 150ms ease;

  &:hover:not(:disabled) {
    background-color: var(--bg-hover);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.btn-save-password {
  align-self: flex-end;
}
</style>
