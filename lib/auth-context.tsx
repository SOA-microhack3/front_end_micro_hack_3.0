"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { User, UserRole } from './types'
import { clearAuthStorage, getMe, getStoredUser, login as apiLogin, logout as apiLogout, persistAuth, setStoredUser, updateUser } from './api'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<User | null>
  logout: () => void
  switchRole: (role: UserRole) => void
  updateProfile: (updates: { fullName?: string; email?: string }) => Promise<User>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const login = useCallback(async (email: string, _password: string): Promise<User | null> => {
    const auth = await apiLogin(email, _password)
    persistAuth(auth)
    const mappedUser: User = {
      id: auth.user.id,
      email: auth.user.email,
      fullName: auth.user.fullName,
      role: auth.user.role,
    }
    setUser(mappedUser)
    return mappedUser
  }, [])

  const logout = useCallback(() => {
    apiLogout().catch(() => null)
    clearAuthStorage()
    setUser(null)
  }, [])

  const switchRole = useCallback((role: UserRole) => {
    setUser((prev) => (prev ? { ...prev, role } : prev))
  }, [])

  const updateProfile = useCallback(
    async (updates: { fullName?: string; email?: string }) => {
      if (!user) {
        throw new Error("Not authenticated")
      }
      const updated = await updateUser(user.id, updates)
      const mappedUser: User = {
        id: updated.id,
        email: updated.email,
        fullName: updated.fullName,
        role: updated.role,
      }
      setUser(mappedUser)
      setStoredUser(mappedUser)
      return mappedUser
    },
    [user]
  )

  useEffect(() => {
    let isMounted = true
    const hydrate = async () => {
      const storedUser = getStoredUser()
      if (storedUser) {
        setUser(storedUser)
        try {
          const me = await getMe()
          if (isMounted) {
            setUser({
              id: me.id,
              email: me.email,
              fullName: me.fullName,
              role: me.role,
            })
          }
        } catch {
          if (isMounted) {
            clearAuthStorage()
            setUser(null)
          }
        }
      }
      if (isMounted) setIsLoading(false)
    }

    hydrate()
    return () => {
      isMounted = false
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout, switchRole, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
