import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import LoginView from '../views/LoginView.vue'
import DashboardView from '../views/DashboardView.vue'
import ProfileView from '../views/ProfileView.vue'
import AboutView from '../views/AboutView.vue'

/**
 * Defines the routes for the application, including authentication requirements.
 * - '/' redirects to '/dashboard'.
 * - '/login' is accessible only to guests (unauthenticated users).
 * - '/dashboard' and '/profile' require authentication.
 * - '/about' is accessible to all users.
 */
const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { guestOnly: true }
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: DashboardView,
    meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'profile',
    component: ProfileView,
    meta: { requiresAuth: true }
  },
  {
    path: '/about',
    name: 'about',
    component: AboutView
  }
]

/** 
 * Creates a Vue Router instance with hash-based history and the defined routes.
 * Sets up a global navigation guard to handle authentication checks before each route change.
 */
const router = createRouter({
  history: createWebHashHistory(),
  routes
})

/**
 * Global navigation guard to enforce authentication and guest-only access.
 * Redirects users based on their authentication status and the route's meta properties.
 * - If a route requires authentication and the user is not authenticated, redirect to '/login'.
 * - If a route is guest-only and the user is authenticated, redirect to '/dashboard'.
 */
router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login' }
  }
  if (to.meta.guestOnly && auth.isAuthenticated) {
    return { name: 'dashboard' }
  }
})

export default router