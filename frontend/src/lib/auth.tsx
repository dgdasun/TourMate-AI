import { useQueryClient } from '@tanstack/react-query'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { api, configureAuth } from './api'
import type { AuthResponse, Role, User } from './types'

interface Session {
  token: string
  user: User
  /** epoch ms */
  expiresAt: number
}

interface AuthContextValue {
  user: User | null
  login: (email: string, password: string) => Promise<User>
  register: (data: { fullName: string; email: string; password: string; country?: string }) => Promise<User>
  logout: () => void
}

const STORAGE_KEY = 'tourmate-session'
const AuthContext = createContext<AuthContextValue | null>(null)

function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const s = JSON.parse(raw) as Session
    return s.expiresAt > Date.now() ? s : null
  } catch {
    return null
  }
}

function saveSession(s: Session | null) {
  try {
    if (s) localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
    else localStorage.removeItem(STORAGE_KEY)
  } catch { /* storage blocked: the session still lasts for this tab */ }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(loadSession)
  const queryClient = useQueryClient()

  const logout = useCallback(() => {
    setSession(null)
    saveSession(null)
    queryClient.clear()
  }, [queryClient])

  // configured during render so the very first queries already carry the token
  configureAuth(() => session?.token ?? null, logout)

  useEffect(() => {
    if (!session) return
    // sign out automatically when the token expires
    const timer = setTimeout(logout, Math.max(0, session.expiresAt - Date.now()))
    return () => clearTimeout(timer)
  }, [session, logout])

  const start = useCallback((res: AuthResponse) => {
    const s = { token: res.token, user: res.user, expiresAt: Date.now() + res.expiresIn * 1000 }
    setSession(s)
    saveSession(s)
    queryClient.clear()
    return res.user
  }, [queryClient])

  const value = useMemo<AuthContextValue>(() => ({
    user: session?.user ?? null,
    login: async (email, password) => start(await api.login({ email, password })),
    register: async (data) => start(await api.register(data)),
    logout
  }), [session, start, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

/** Sends signed-out visitors to the login page and brings them back afterwards. */
export function RequireAuth({ children, role }: { children: ReactNode; role?: Role }) {
  const { user } = useAuth()
  const location = useLocation()
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  if (role && user.role !== role) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

export const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join('')
