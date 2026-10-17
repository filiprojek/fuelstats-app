import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import App from '@/App.vue'
import NotFoundView from '@/views/NotFoundView.vue'
import { makeRouter } from '@/test/utils'

async function mountAt(path: string) {
  const router = makeRouter([
    { path: '/hidden', name: 'hidden', meta: { hideNav: true, hideHeader: true }, component: { template: '<p>hidden</p>' } },
    { path: '/titled', name: 'titled', meta: { title: 'Vehicles' }, component: { template: '<p>titled</p>' } },
  ])
  await router.push(path)
  await router.isReady()
  const wrapper = mount(App, { global: { plugins: [router] } })
  await flushPromises()
  return wrapper
}

describe('App layout', () => {
  it('shows navigation and the route title', async () => {
    const w = await mountAt('/titled')
    expect(w.find('aside.desktop-sidebar').exists()).toBe(true)
    expect(w.find('header h1').text()).toBe('Vehicles')
    expect(w.text()).toContain('titled')
  })

  it('falls back to the app name as title', async () => {
    const w = await mountAt('/')
    expect(w.find('header h1').text()).toBe('Fuel Stats')
  })

  it('hides navigation and header when the route asks for it', async () => {
    const w = await mountAt('/hidden')
    expect(w.find('aside.desktop-sidebar').exists()).toBe(false)
    expect(w.find('header').exists()).toBe(false)
  })
})

describe('NotFoundView', () => {
  it('links back home', async () => {
    const router = makeRouter()
    const w = mount(NotFoundView, { global: { plugins: [router] } })
    expect(w.find('h1').text()).toBe('404 - Not found')
    expect(w.find('a').attributes('href')).toBe('/')
  })
})
