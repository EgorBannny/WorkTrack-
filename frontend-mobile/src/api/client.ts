import axios from 'axios'
import { QueryClient } from '@tanstack/react-query'
import * as SecureStore from 'expo-secure-store'
import { API_BASE_URL } from '../config'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 1000 * 60 * 5 },
  },
})

const client = axios.create({ baseURL: API_BASE_URL })

// ── Добавляем Bearer token к каждому запросу ──────────────
client.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Автообновление токена при 401 ─────────────────────────
let isRefreshing = false
let queue: Array<{ resolve: () => void; reject: (e: unknown) => void }> = []

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

    if (original.url?.includes('/api/auth/bearer/refresh')) {
      await SecureStore.deleteItemAsync('access_token')
      await SecureStore.deleteItemAsync('refresh_token')
      const { useAuthStore } = await import('../store/auth.store')
      useAuthStore.getState().setUser(null)
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise<void>((resolve, reject) => {
        queue.push({ resolve, reject })
      })
        .then(() => client(original))
        .catch((e) => Promise.reject(e))
    }

    original._retry = true
    isRefreshing = true

    try {
      const accessToken = await SecureStore.getItemAsync('access_token')
      const refreshToken = await SecureStore.getItemAsync('refresh_token')

      const res = await client.post<{ access_token: string; refresh_token: string }>(
        '/api/auth/bearer/refresh',
        { access_token: accessToken, refresh_token: refreshToken },
      )

      await SecureStore.setItemAsync('access_token', res.data.access_token)
      await SecureStore.setItemAsync('refresh_token', res.data.refresh_token)

      processQueue(null)
      return client(original)
    } catch (refreshError) {
      processQueue(refreshError)
      await SecureStore.deleteItemAsync('access_token')
      await SecureStore.deleteItemAsync('refresh_token')
      const { useAuthStore } = await import('../store/auth.store')
      useAuthStore.getState().setUser(null)
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)

export default client