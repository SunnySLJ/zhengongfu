import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Team } from '../types/auth'

interface AuthState {
  token: string | null
  user: User | null
  team: Team | null
  isAuthenticated: boolean
  login: (token: string, user: User, team: Team) => void
  logout: () => void
  updateUser: (user: Partial<User>) => void
  updateTeam: (team: Partial<Team>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      team: null,
      isAuthenticated: false,

      login: (token, user, team) =>
        set({ token, user, team, isAuthenticated: true }),

      logout: () =>
        set({ token: null, user: null, team: null, isAuthenticated: false }),

      updateUser: (partial) => {
        const current = get().user
        if (current) set({ user: { ...current, ...partial } })
      },

      updateTeam: (partial) => {
        const current = get().team
        if (current) set({ team: { ...current, ...partial } })
      },
    }),
    { name: 'auth-storage' }
  )
)
