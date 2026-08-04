import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import * as authApi from '@/api/auth'
import { setOnAuthExpired } from '@/api/client'
import type { AuthUser } from '@/types/auth'

interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  login: (username: string, password: string) => Promise<AuthUser>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Restore the session on page load from the httpOnly refresh cookie — the equivalent of a
    // PHP session surviving a page refresh, since the access token itself only lives in memory/localStorage.
    authApi
      .refresh()
      .then(({ user, accessToken }) => {
        localStorage.setItem('accessToken', accessToken)
        setUser(user)
      })
      .catch(() => {
        localStorage.removeItem('accessToken')
      })
      .finally(() => setIsLoading(false))

    setOnAuthExpired(() => setUser(null))
    return () => setOnAuthExpired(null)
  }, [])

  async function login(username: string, password: string) {
    const { user, accessToken } = await authApi.login(username, password)
    localStorage.setItem('accessToken', accessToken)
    setUser(user)
    return user
  }

  async function logout() {
    await authApi.logout()
    localStorage.removeItem('accessToken')
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, isLoading, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
