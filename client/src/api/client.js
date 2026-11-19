import axios from 'axios'

/**
 * Axios instance for API requests with base URL and authorization header.
 * Automatically includes the JWT token from localStorage in the Authorization header for authenticated requests.
 * Resolves the API base URL dynamically:
 * - Under `/task-app/` in production -> `/task-app/api`
 * - Locally on Vite (`/` or Cypress component iframe) -> `/api`
 */
const resolveBaseURL = () => {
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/task-app')) {
    return '/task-app/api'
  }
  return '/api'
}

const api = axios.create({
  baseURL: resolveBaseURL()
})
/**
 * Request interceptor to add the Authorization header with the JWT token from localStorage.
 * This ensures that all API requests include the token for authentication.
 */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('task_app_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api