import { create } from 'zustand'
import type { UserMe } from '../api/auth.api'

interface AuthState {
  user: UserMe | null
  isInitialized: boolean
  setUser: (user: UserMe | null) => void
  setInitialized: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isInitialized: false,
  setUser: (user) => set({ user }),
  setInitialized: () => set({ isInitialized: true }),
}))