import axios from 'axios'

const api = axios.create({
  baseURL: 'api'
})

// Injeta automaticamente o token JWT armazenado no localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('task_app_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api