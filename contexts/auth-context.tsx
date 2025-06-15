"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { User } from "@/lib/models"

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  register: (name: string, email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  loading: boolean
  isAuthenticated: boolean
  error: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const isAuthenticated = !!user

  // Handle mounting
  useEffect(() => {
    setMounted(true)
  }, [])

  // Check authentication status on mount
  useEffect(() => {
    if (mounted) {
      checkAuth()
    }
  }, [mounted])

  const checkAuth = async () => {
    try {
      setError(null)
      console.log("🔍 Checking authentication...")

      const response = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })

      console.log("Auth response status:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("Auth response data:", data)
        if (data.success && data.user) {
          setUser(data.user)
          console.log("✅ User authenticated:", data.user.email)
        }
      } else {
        console.log("❌ Auth check failed with status:", response.status)
        const errorData = await response.text()
        console.log("Error response:", errorData)
      }
    } catch (error) {
      console.error("❌ Auth check failed:", error)
      setError("Authentication check failed")
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setError(null)
      console.log("🔐 Attempting login for:", email)

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      })

      console.log("Login response status:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("Login response data:", data)

        if (data.success && data.user) {
          setUser(data.user)
          console.log("✅ Login successful for:", data.user.email)
          return true
        }
      } else {
        const errorData = await response.text()
        console.log("❌ Login failed:", errorData)
        setError("Login failed")
      }
      return false
    } catch (error) {
      console.error("❌ Login error:", error)
      setError("Login failed: " + String(error))
      return false
    }
  }

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      setError(null)
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, email, password }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.user) {
          setUser(data.user)
          return true
        }
      }
      return false
    } catch (error) {
      console.error("Registration failed:", error)
      setError("Registration failed: " + String(error))
      return false
    }
  }

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      })
      setUser(null)
      setError(null)
      if (typeof window !== "undefined") {
        router.push("/login")
        router.refresh()
      }
    } catch (error) {
      console.error("Logout failed:", error)
      // Still clear user state even if logout request fails
      setUser(null)
      if (typeof window !== "undefined") {
        router.push("/login")
      }
    }
  }

  // Don't render anything until mounted
  if (!mounted) {
    return null
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, isAuthenticated, error }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
