"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { TrendingUp, Users, FileText, DollarSign, Activity, Clock, Zap, Calendar, AlertCircle } from "lucide-react"

interface DashboardStats {
  projects: {
    total: number
    active: number
    completed: number
    pending: number
  }
  clients: {
    total: number
    active: number
    new: number
  }
  revenue: {
    total: number
    thisMonth: number
    growth: number
  }
  priceItems: {
    total: number
    categories: number
  }
  recentActivity: ActivityItem[]
  matchingStats: {
    totalMatches: number
    averageConfidence: number
    successRate: number
    processingTime: number
  }
}

interface ActivityItem {
  id: string
  type: "project" | "client" | "match"
  title: string
  description: string
  timestamp: string
  status: "success" | "pending" | "error"
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

export function AdvancedDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchDashboardData = async () => {
    try {
      console.log("🔄 Fetching dashboard data...")
      const response = await fetch("/api/dashboard/stats", {
        credentials: "include",
      })

      console.log("📊 Dashboard API response status:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("✅ Dashboard data received:", data)
        setStats(data)
        setError(null)
      } else {
        const errorText = await response.text()
        console.error("❌ Dashboard API error:", response.status, errorText)
        setError(`Failed to fetch dashboard data: ${response.status}`)
      }
    } catch (error) {
      console.error("❌ Dashboard fetch error:", error)
      setError("Network error while fetching dashboard data")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchDashboardData()
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            <p className="text-muted-foreground">Loading dashboard data...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            <p className="text-muted-foreground">Error loading dashboard</p>
          </div>
          <Button onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? "Retrying..." : "Retry"}
          </Button>
        </div>
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">Dashboard Error</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">{error}</p>
            <p className="text-xs text-muted-foreground mt-1">Check the browser console for more details.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            <p className="text-muted-foreground">No data available</p>
          </div>
          <Button onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? "Loading..." : "Refresh"}
          </Button>
        </div>
      </div>
    )
  }

  const projectsByStatus = [
    { name: "Active", value: stats.projects.active, color: "#0088FE" },
    { name: "Completed", value: stats.projects.completed, color: "#00C49F" },
    { name: "Pending", value: stats.projects.pending, color: "#FFBB28" },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">Welcome back! Here's what's happening with your projects.</p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.projects.total}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                {stats.projects.active} active
              </span>
            </p>
          </CardContent>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.projects.active}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-orange-600 flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                {stats.projects.completed} completed
              </span>
            </p>
          </CardContent>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-red-500"></div>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.clients.total}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                {stats.clients.new} new this month
              </span>
            </p>
          </CardContent>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-teal-500"></div>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Price Items</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.priceItems.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-blue-600 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                {stats.priceItems.categories} categories
              </span>
            </p>
          </CardContent>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-green-500"></div>
        </Card>
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Projects by Status</CardTitle>
            <CardDescription>Current project distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={projectsByStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {projectsByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest system activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-64 overflow-y-auto">
              {stats.recentActivity.length > 0 ? (
                stats.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border">
                    <div
                      className={`w-2 h-2 rounded-full mt-2 ${
                        activity.status === "success"
                          ? "bg-green-500"
                          : activity.status === "error"
                            ? "bg-red-500"
                            : "bg-blue-500"
                      }`}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">{activity.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          {activity.type}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{activity.description}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(activity.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Matching Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Matching Performance
          </CardTitle>
          <CardDescription>AI price matching statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.matchingStats.totalMatches}</div>
              <p className="text-sm text-muted-foreground">Total Matches</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.matchingStats.averageConfidence}%</div>
              <p className="text-sm text-muted-foreground">Avg Confidence</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.matchingStats.successRate}%</div>
              <p className="text-sm text-muted-foreground">Success Rate</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.matchingStats.processingTime}s</div>
              <p className="text-sm text-muted-foreground">Avg Processing</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
