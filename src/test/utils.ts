import { createRouter, createMemoryHistory, type RouteRecordRaw } from 'vue-router'
import { defineComponent, h } from 'vue'

const Stub = (name: string) => defineComponent({ name, render: () => h('div', name) })

/** Minimal router with the app's route names, for mounting views in isolation */
export function makeRouter(extra: RouteRecordRaw[] = []) {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: Stub('Home') },
      { path: '/login', name: 'login', component: Stub('Login') },
      { path: '/signup', name: 'signup', component: Stub('Signup') },
      { path: '/settings', name: 'settings', component: Stub('Settings') },
      ...extra,
    ],
  })
}

/** Build an axios-like error */
export function axiosError(status: number, data: unknown = {}) {
  return Object.assign(new Error(`Request failed with status code ${status}`), {
    isAxiosError: true,
    response: { status, data },
  })
}
