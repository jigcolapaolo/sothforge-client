'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { authApi, clearTokens, setTokens, usersApi, type User } from './api'

type AuthContextValue = {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  updateUser: (user: User) => void
  logoutAll: () => Promise<void>
  logout: () => Promise<void>
}
const AuthContext = createContext<AuthContextValue | null>(null)
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const refreshToken = sessionStorage.getItem('sothforge_refresh_token')
    if (!refreshToken) {
      Promise.resolve().then(() => setLoading(false))
      return
    }
    usersApi
      .me()
      .then(setUser)
      .catch(clearTokens)
      .finally(() => setLoading(false))
  }, [])
  const login = async (email: string, password: string) => {
    setTokens(await authApi.login({ email, password }))
    setUser(await usersApi.me())
  }
  const register = async (username: string, email: string, password: string) => {
    await authApi.register({ username, email, password })
    await login(email, password)
  }
  const logout = async () => {
    await authApi.logout().catch(() => undefined)
    clearTokens()
    setUser(null)
  }
  const logoutAll = async () => {
    await authApi.logoutAll().catch(() => undefined)
    clearTokens()
    setUser(null)
  }
  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, updateUser: setUser, logout, logoutAll }}
    >
      {children}
    </AuthContext.Provider>
  )
}
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
