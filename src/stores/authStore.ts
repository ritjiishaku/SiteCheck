import { create } from 'zustand'

interface AuthState {
  token: string | null
  user: {
    medic_id: string
    full_name: string
    email: string
    role: string
    company_name: string
  } | null
  isOnline: boolean
  setAuth: (token: string, user: AuthState['user']) => void
  clearAuth: () => void
  setOnline: (online: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  user: null,
  isOnline: typeof window !== 'undefined' ? navigator.onLine : true,
  setAuth: (token, user) => {
    localStorage.setItem('token', token)
    set({ token, user })
  },
  clearAuth: () => {
    localStorage.removeItem('token')
    set({ token: null, user: null })
  },
  setOnline: (isOnline) => set({ isOnline }),
}))
