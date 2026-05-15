import axios from 'axios'
import { QueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth.store'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 1000 * 60 * 5 },
  },
})

const client = axios.create({
  withCredentials: true,
})

let isRefreshing = false
let queue: Array<{ resolve: (value?: unknown) => void; reject: (err: unknown) => void }> = []

function processQueue(error: unknown) {
  queue.forEach((p) => (error ? p.reject(error) : p.resolve()))
  queue = []
}

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error)
    }

    if (original.url?.includes('/api/auth/cookie/refresh')) {
      useAuthStore.getState().setUser(null)
      window.location.href = '/'
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        queue.push({ resolve, reject })
      })
        .then(() => client(original))
        .catch((err) => Promise.reject(err))
    }

    original._retry = true
    isRefreshing = true

    try {
      await client.post('/api/auth/cookie/refresh')
      processQueue(null)
      return client(original)
    } catch (refreshError) {
      processQueue(refreshError)
      useAuthStore.getState().setUser(null)
      window.location.href = '/'
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)

export default client
