import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: number
  email: string
  role: 'customer' | 'admin'
}

interface AuthStore {
  user: User | null
  token: string | null
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  logout: () => void
  isAuthenticated: () => boolean
  isAdmin: () => boolean
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,

      setUser: (user) => set({ user }),

      setToken: (token) => set({ token }),

      logout: () => set({ user: null, token: null }),

      isAuthenticated: () => !!get().token && !!get().user,

      isAdmin: () => get().user?.role === 'admin',
    }),
    {
      name: 'auth-storage',
    }
  )
)