"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { AdvancedDashboard } from "@/components/advanced-dashboard"
import { NotificationSystem } from "@/components/notification-system"

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <div className="container mx-auto p-6">
        <AdvancedDashboard />
        <NotificationSystem />
      </div>
    </ProtectedRoute>
  )
}
