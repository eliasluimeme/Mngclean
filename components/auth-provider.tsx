"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, AuthContextType } from '@/lib/auth.types'

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  error: null,
  login: async () => ({ success: false, error: "Not initialized" }),
  logout: async () => {},
  checkSession: async () => null,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const initAuth = async () => {
      try {
        const currentUser = await checkSession()
        if (!currentUser && !window.location.pathname.includes('/login')) {
          router.push('/login')
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        if (!window.location.pathname.includes('/login')) {
          router.push('/login')
        }
      }
    }
    initAuth()
  }, [])

  const checkSession = async (): Promise<User | null> => {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
        },
      })
      
      if (!response.ok) {
        // throw new Error("Failed to check session")
        return null
      }
      
      const data = await response.json()
      if (data.user) {
        setUser(data.user)
        return data.user
      }
      setUser(null)
      return null
    } catch (err) {
      console.error("Session check error:", err)
      setError("Failed to check session")
      setUser(null)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Login failed")
      }

      if (data.user) {
        setUser(data.user)
        if (data.user.role === "admin") {
          router.push("/dashboard")
        } else {
          router.push("/bookings")
        }
        return { success: true, user: data.user }
      }
      throw new Error("No user data received")
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Login failed"
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      setIsLoading(true)
      await fetch("/api/auth/logout", { 
        method: "POST",
        credentials: 'include',
      })
      setUser(null)
      router.push("/login")
    } catch (err) {
      console.error("Logout error:", err)
      setError("Failed to logout")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        login,
        logout,
        checkSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

