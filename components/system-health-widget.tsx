"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, AlertTriangle, XCircle, Database, Zap, RefreshCw, TrendingUp } from "lucide-react"

interface SystemHealth {
  overall: "healthy" | "warning" | "critical"
  database: {
    status: "connected" | "disconnected" | "slow"
    responseTime: number
    connections: number
  }
  ai: {
    cohere: "online" | "offline" | "limited"
    openai: "online" | "offline" | "limited"
  }
  performance: {
    avgResponseTime: number
    successRate: number
    errorRate: number
  }
  lastCheck: string
}

export function SystemHealthWidget() {
  const [health, setHealth] = useState<SystemHealth | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    checkSystemHealth()
    const interval = setInterval(checkSystemHealth, 30000) // Check every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const checkSystemHealth = async () => {
    try {
      console.log("🔍 Checking system health...")
      const response = await fetch("/api/system/health")
      if (response.ok) {
        const data = await response.json()
        setHealth(data)
        console.log("✅ System health updated:", data.overall)
      }
    } catch (error) {
      console.error("❌ Health check failed:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const refreshHealth = async () => {
    setRefreshing(true)
    await checkSystemHealth()
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
      case "connected":
      case "online":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "warning":
      case "slow":
      case "limited":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case "critical":
      case "disconnected":
      case "offline":
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
      case "connected":
      case "online":
        return "default"
      case "warning":
      case "slow":
      case "limited":
        return "secondary"
      case "critical":
      case "disconnected":
      case "offline":
        return "destructive"
      default:
        return "outline"
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
            System Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="animate-pulse h-4 bg-muted rounded w-3/4"></div>
            <div className="animate-pulse h-4 bg-muted rounded w-1/2"></div>
            <div className="animate-pulse h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!health) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-600" />
            System Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Unable to check system health</p>
          <Button onClick={refreshHealth} size="sm" className="mt-2">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon(health.overall)}
            System Health
            <Badge variant={getStatusColor(health.overall)}>{health.overall.toUpperCase()}</Badge>
          </CardTitle>
          <Button onClick={refreshHealth} disabled={refreshing} size="sm" variant="outline">
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Database Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <span className="text-sm font-medium">Database</span>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon(health.database.status)}
            <Badge variant={getStatusColor(health.database.status)}>{health.database.status}</Badge>
            <span className="text-xs text-muted-foreground">{health.database.responseTime}ms</span>
          </div>
        </div>

        {/* AI Services */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              <span className="text-sm font-medium">Cohere AI</span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(health.ai.cohere)}
              <Badge variant={getStatusColor(health.ai.cohere)}>{health.ai.cohere}</Badge>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              <span className="text-sm font-medium">OpenAI</span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(health.ai.openai)}
              <Badge variant={getStatusColor(health.ai.openai)}>{health.ai.openai}</Badge>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm font-medium">Performance</span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Success Rate</span>
              <span className="font-medium">{health.performance.successRate}%</span>
            </div>
            <Progress value={health.performance.successRate} className="h-2" />

            <div className="flex justify-between text-sm">
              <span>Avg Response Time</span>
              <span className="font-medium">{health.performance.avgResponseTime}ms</span>
            </div>

            <div className="flex justify-between text-sm">
              <span>Error Rate</span>
              <span className={`font-medium ${health.performance.errorRate > 5 ? "text-red-600" : "text-green-600"}`}>
                {health.performance.errorRate}%
              </span>
            </div>
          </div>
        </div>

        <div className="text-xs text-muted-foreground border-t pt-2">
          Last checked: {new Date(health.lastCheck).toLocaleString()}
        </div>
      </CardContent>
    </Card>
  )
}
