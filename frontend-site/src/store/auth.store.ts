import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserMe } from '@/api/auth.api'

interface AuthStore {
  user: UserMe | null
  setUser: (user: UserMe | null) => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
    }),
    { name: 'wt-auth' },
  ),
)