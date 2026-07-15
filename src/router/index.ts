import { createRouter, createWebHistory } from 'vue-router'
import api from '@/lib/api'
import HomeView from '../views/HomeView.vue'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      meta: { title: 'Fuel Stats', requiresAuth: true },
      component: HomeView,
    },
    {
      path: '/add/:type?',
      name: 'add',
      meta: { title: 'Add record', requiresAuth: true },
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AddView.vue'),
    },
    {
      path: '/vehicles',
      name: 'vehicles',
      meta: { title: 'Vehicles', requiresAuth: true },
      component: () => import('../views/VehiclesView.vue'),
    },
    {
      path: '/history',
      name: 'history',
      meta: { title: 'History', requiresAuth: true },
      component: () => import('../views/AboutView.vue'),
    },
    {
      path: '/settings',
      name: 'settings',
      meta: { title: 'Settings', requiresAuth: true },
      component: () => import('../views/SettingsView.vue'),
    },{
      path: '/login',
      name: 'login',
      meta: { title: 'Log In', hideNav: true, hideHeader: true },
      component: () => import('../views/LoginSignupView.vue'),
    },{
      path: '/signup',
      name: 'signup',
      meta: { title: 'Sign Up', hideNav: true, hideHeader: true },
      component: () => import('../views/LoginSignupView.vue'),
    },
    // will match everything and put it under `route.params.pathMatch`
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      meta: { title: '404 - Not found', hideNav: true, hideHeader: true },
      component: () => import('../views/NotFoundView.vue'),

    },
  ],
})

let authChecked = false
router.beforeEach(async (to) => {
  const auth = useAuthStore()

  if (!authChecked) {
    authChecked = true
    try {
      const res = await api.get('/user/me')
      auth.setUser(res.data)
    } catch {
      auth.clear()
    }
  }

  if (to.meta.requiresAuth && !auth.user) {
    return '/login'
  }
})

export default router
