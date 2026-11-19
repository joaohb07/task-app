import axios from 'axios'

/**
 * Axios instance for API requests with base URL and authorization header.
 * Automatically includes the JWT token from localStorage in the Authorization header for authenticated requests.
 */
const api = axios.create({
  baseURL: 'api'
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