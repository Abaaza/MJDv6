"use client"

import { useAuth } from "@/contexts/auth-context"
import { SystemDashboard } from "@/components/system-dashboard"
import { LayoutWrapper } from "@/components/layout-wrapper"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function AdminPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      router.push("/login")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <LayoutWrapper>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </LayoutWrapper>
    )
  }

  if (!user || user.role !== "admin") {
    return null
  }

  return (
    <LayoutWrapper>
      <SystemDashboard />
    </LayoutWrapper>
  )
}
