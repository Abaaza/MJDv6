"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  Globe,
  Server,
  Users,
  Download,
  RefreshCw,
  BarChart3,
} from "lucide-react"

interface SystemHealth {
  overall: "healthy" | "warning" | "critical"
  metrics: Array<{
    name: string
    value: number
    unit: string
    status: "healthy" | "warning" | "critical"
    threshold: { warning: number; critical: number }
    lastUpdated: Date
  }>
  services: Array<{
    name: string
    status: "online" | "offline" | "degraded"
    responseTime?: number
    lastCheck: Date
    error?: string
  }>
  lastCheck: Date
}

interface SystemStats {
  totalUsers: number
  activeUsers: number
  totalJobs: number
  completedJobs: number
  totalApiCalls: number
  errorRate: number
}

export function SystemDashboard() {
  const [health, setHealth] = useState<SystemHealth | null>(null)
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [alerts, setAlerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  useEffect(() => {
    loadDashboardData()
    const interval = setInterval(loadDashboardData, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const loadDashboardData = async () => {
    try {
      const [healthRes, statsRes, alertsRes] = await Promise.all([
        fetch("/api/system/health"),
        fetch("/api/system/stats"),
        fetch("/api/system/alerts"),
      ])

      if (healthRes.ok) {
        const healthData = await healthRes.json()
        setHealth(healthData)
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }

      if (alertsRes.ok) {
        const alertsData = await alertsRes.json()
        setAlerts(alertsData.alerts || [])
      }

      setLastRefresh(new Date())
    } catch (error) {
      console.error("Failed to load dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
      case "online":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "warning":
      case "degraded":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case "critical":
      case "offline":
        return <AlertTriangle className="h-5 w-5 text-red-600" />
      default:
        return <Clock className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
      case "online":
        return "text-green-600"
      case "warning":
      case "degraded":
        return "text-yellow-600"
      case "critical":
      case "offline":
        return "text-red-600"
      default:
        return "text-gray-400"
    }
  }

  const exportHealthData = async () => {
    try {
      const response = await fetch("/api/system/health/export")
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `system-health-${new Date().toISOString().split("T")[0]}.json`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error("Failed to export health data:", error)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-4">
        <div className="text-center py-8">Loading system dashboard...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Dashboard</h1>
          <p className="text-muted-foreground">Last updated: {lastRefresh.toLocaleTimeString()} • Auto-refresh: 30s</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={loadDashboardData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          <Button onClick={exportHealthData} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      {health && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(health.overall)}
              System Health
              <Badge
                variant={
                  health.overall === "healthy" ? "default" : health.overall === "warning" ? "secondary" : "destructive"
                }
              >
                {health.overall.toUpperCase()}
              </Badge>
            </CardTitle>
            <CardDescription>Real-time system health monitoring and alerts</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="metrics">Metrics</TabsTrigger>
                <TabsTrigger value="services">Services</TabsTrigger>
                <TabsTrigger value="alerts">Alerts ({alerts.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Key Stats */}
                {stats && (
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <Users className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="text-sm font-medium">Total Users</p>
                            <p className="text-2xl font-bold">{stats.totalUsers}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <Activity className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="text-sm font-medium">Active Users</p>
                            <p className="text-2xl font-bold">{stats.activeUsers}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-5 w-5 text-purple-600" />
                          <div>
                            <p className="text-sm font-medium">Total Jobs</p>
                            <p className="text-2xl font-bold">{stats.totalJobs}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="text-sm font-medium">Completed</p>
                            <p className="text-2xl font-bold">{stats.completedJobs}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <Globe className="h-5 w-5 text-orange-600" />
                          <div>
                            <p className="text-sm font-medium">API Calls</p>
                            <p className="text-2xl font-bold">{stats.totalApiCalls.toLocaleString()}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-red-600" />
                          <div>
                            <p className="text-sm font-medium">Error Rate</p>
                            <p className="text-2xl font-bold">{stats.errorRate.toFixed(1)}%</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Quick Health Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">System Metrics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {health.metrics.slice(0, 4).map((metric) => (
                          <div key={metric.name} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(metric.status)}
                              <span className="text-sm font-medium">{metric.name}</span>
                            </div>
                            <div className="text-right">
                              <span className={`text-sm font-bold ${getStatusColor(metric.status)}`}>
                                {metric.value.toFixed(1)}
                                {metric.unit}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Service Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {health.services.map((service) => (
                          <div key={service.name} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(service.status)}
                              <span className="text-sm font-medium">{service.name}</span>
                            </div>
                            <div className="text-right">
                              <Badge
                                variant={
                                  service.status === "online"
                                    ? "default"
                                    : service.status === "degraded"
                                      ? "secondary"
                                      : "destructive"
                                }
                              >
                                {service.status}
                              </Badge>
                              {service.responseTime && (
                                <p className="text-xs text-muted-foreground">{service.responseTime}ms</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="metrics" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {health.metrics.map((metric) => (
                    <Card key={metric.name}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          {getStatusIcon(metric.status)}
                          {metric.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-2xl font-bold">
                              {metric.value.toFixed(1)}
                              {metric.unit}
                            </span>
                            <Badge
                              variant={
                                metric.status === "healthy"
                                  ? "default"
                                  : metric.status === "warning"
                                    ? "secondary"
                                    : "destructive"
                              }
                            >
                              {metric.status}
                            </Badge>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Warning Threshold</span>
                              <span>
                                {metric.threshold.warning}
                                {metric.unit}
                              </span>
                            </div>
                            <Progress
                              value={(metric.value / metric.threshold.critical) * 100}
                              className="h-2"
                              // Custom color based on status
                            />
                            <div className="flex justify-between text-sm">
                              <span>Critical Threshold</span>
                              <span>
                                {metric.threshold.critical}
                                {metric.unit}
                              </span>
                            </div>
                          </div>

                          <p className="text-xs text-muted-foreground">
                            Last updated: {new Date(metric.lastUpdated).toLocaleString()}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="services" className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Response Time</TableHead>
                      <TableHead>Last Check</TableHead>
                      <TableHead>Error</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {health.services.map((service) => (
                      <TableRow key={service.name}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {service.name === "MongoDB" && <Database className="h-4 w-4" />}
                            {service.name.includes("API") && <Globe className="h-4 w-4" />}
                            {!service.name.includes("API") && service.name !== "MongoDB" && (
                              <Server className="h-4 w-4" />
                            )}
                            <span className="font-medium">{service.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(service.status)}
                            <Badge
                              variant={
                                service.status === "online"
                                  ? "default"
                                  : service.status === "degraded"
                                    ? "secondary"
                                    : "destructive"
                              }
                            >
                              {service.status}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          {service.responseTime ? `${service.responseTime}ms` : "N/A"}
                          {service.responseTime && service.responseTime > 1000 && (
                            <AlertTriangle className="inline h-4 w-4 ml-1 text-yellow-600" />
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(service.lastCheck).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {service.error ? (
                            <span className="text-red-600 text-sm">{service.error}</span>
                          ) : (
                            <span className="text-green-600 text-sm">None</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="alerts" className="space-y-4">
                {alerts.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
                    <h3 className="text-lg font-semibold mb-2">No Active Alerts</h3>
                    <p className="text-muted-foreground">All systems are operating normally.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {alerts.map((alert, index) => (
                      <Alert key={index} variant={alert.severity === "critical" ? "destructive" : "default"}>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle className="flex items-center gap-2">
                          {alert.name}
                          <Badge variant={alert.severity === "critical" ? "destructive" : "secondary"}>
                            {alert.severity}
                          </Badge>
                        </AlertTitle>
                        <AlertDescription>
                          {alert.message}
                          <br />
                          <span className="text-xs text-muted-foreground">
                            {new Date(alert.timestamp).toLocaleString()}
                          </span>
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
