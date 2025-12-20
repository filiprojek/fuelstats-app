import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      meta: { title: 'Fuel Stats' },
      component: HomeView,
    },
    {
      path: '/add',
      name: 'add',
      meta: { title: 'Add record' },
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue'),
    },
    {
      path: '/vehicles',
      name: 'vehicles',
      meta: { title: 'Vehicles' },
      component: () => import('../views/AboutView.vue'),
    },
    {
      path: '/history',
      name: 'history',
      meta: { title: 'History' },
      component: () => import('../views/AboutView.vue'),
    },
    {
      path: '/settings',
      name: 'settings',
      meta: { title: 'Settings' },
      component: () => import('../views/AboutView.vue'),
    },
  ],
})

export default router
