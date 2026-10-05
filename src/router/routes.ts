import type { RouteRecordRaw } from 'vue-router'

/** Every view is code-split; the route curtain covers the screen while a chunk loads. */
export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
    meta: { title: 'Home' },
  },
  {
    path: '/work',
    name: 'work',
    component: () => import('@/views/WorkView.vue'),
    meta: { title: 'Work' },
  },
  {
    path: '/work/:slug',
    name: 'project',
    component: () => import('@/views/ProjectView.vue'),
    props: true,
    meta: { title: 'Case study' },
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('@/views/AboutView.vue'),
    meta: { title: 'About' },
  },
  {
    path: '/contact',
    name: 'contact',
    component: () => import('@/views/ContactView.vue'),
    meta: { title: 'Contact' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { title: 'Lost' },
  },
]
