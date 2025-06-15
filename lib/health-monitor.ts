interface HealthMetric {
  name: string
  value: number
  unit: string
  status: "healthy" | "warning" | "critical"
  threshold: {
    warning: number
    critical: number
  }
  lastUpdated: Date
}

interface SystemHealth {
  overall: "healthy" | "warning" | "critical"
  metrics: HealthMetric[]
  services: ServiceStatus[]
  lastCheck: Date
}

interface ServiceStatus {
  name: string
  status: "online" | "offline" | "degraded"
  responseTime?: number
  lastCheck: Date
  error?: string
}

export class HealthMonitor {
  private static instance: HealthMonitor
  private metrics: Map<string, HealthMetric> = new Map()
  private services: Map<string, ServiceStatus> = new Map()
  private healthHistory: Array<{ timestamp: Date; overall: string; metrics: HealthMetric[] }> = []

  static getInstance(): HealthMonitor {
    if (!HealthMonitor.instance) {
      HealthMonitor.instance = new HealthMonitor()
      HealthMonitor.instance.initializeMetrics()
      HealthMonitor.instance.startMonitoring()
    }
    return HealthMonitor.instance
  }

  private initializeMetrics(): void {
    // Initialize default metrics
    this.metrics.set("memory_usage", {
      name: "Memory Usage",
      value: 0,
      unit: "%",
      status: "healthy",
      threshold: { warning: 80, critical: 95 },
      lastUpdated: new Date(),
    })

    this.metrics.set("api_response_time", {
      name: "API Response Time",
      value: 0,
      unit: "ms",
      status: "healthy",
      threshold: { warning: 1000, critical: 3000 },
      lastUpdated: new Date(),
    })

    this.metrics.set("active_jobs", {
      name: "Active Jobs",
      value: 0,
      unit: "count",
      status: "healthy",
      threshold: { warning: 50, critical: 100 },
      lastUpdated: new Date(),
    })

    this.metrics.set("error_rate", {
      name: "Error Rate",
      value: 0,
      unit: "%",
      status: "healthy",
      threshold: { warning: 5, critical: 10 },
      lastUpdated: new Date(),
    })

    this.metrics.set("database_connections", {
      name: "Database Connections",
      value: 0,
      unit: "count",
      status: "healthy",
      threshold: { warning: 80, critical: 95 },
      lastUpdated: new Date(),
    })

    // Initialize services
    this.services.set("mongodb", {
      name: "MongoDB",
      status: "online",
      lastCheck: new Date(),
    })

    this.services.set("cohere_api", {
      name: "Cohere API",
      status: "online",
      lastCheck: new Date(),
    })

    this.services.set("openai_api", {
      name: "OpenAI API",
      status: "online",
      lastCheck: new Date(),
    })
  }

  private startMonitoring(): void {
    // Check health every 30 seconds
    setInterval(() => {
      this.checkSystemHealth()
    }, 30000)

    // Record health history every 5 minutes
    setInterval(() => {
      this.recordHealthHistory()
    }, 300000)
  }

  updateMetric(name: string, value: number): void {
    const metric = this.metrics.get(name)
    if (!metric) return

    metric.value = value
    metric.lastUpdated = new Date()

    // Update status based on thresholds
    if (value >= metric.threshold.critical) {
      metric.status = "critical"
    } else if (value >= metric.threshold.warning) {
      metric.status = "warning"
    } else {
      metric.status = "healthy"
    }

    this.metrics.set(name, metric)
  }

  updateServiceStatus(name: string, status: ServiceStatus["status"], responseTime?: number, error?: string): void {
    const service = this.services.get(name) || {
      name,
      status: "offline",
      lastCheck: new Date(),
    }

    service.status = status
    service.responseTime = responseTime
    service.error = error
    service.lastCheck = new Date()

    this.services.set(name, service)
  }

  async checkServiceHealth(name: string, url: string): Promise<void> {
    const startTime = Date.now()

    try {
      const response = await fetch(url, {
        method: "GET",
        timeout: 5000,
      })

      const responseTime = Date.now() - startTime

      if (response.ok) {
        this.updateServiceStatus(name, "online", responseTime)
      } else {
        this.updateServiceStatus(name, "degraded", responseTime, `HTTP ${response.status}`)
      }
    } catch (error) {
      const responseTime = Date.now() - startTime
      this.updateServiceStatus(name, "offline", responseTime, error instanceof Error ? error.message : "Unknown error")
    }
  }

  private checkSystemHealth(): void {
    // Simulate memory usage check
    const memoryUsage = Math.random() * 100
    this.updateMetric("memory_usage", memoryUsage)

    // Simulate API response time
    const apiResponseTime = Math.random() * 2000
    this.updateMetric("api_response_time", apiResponseTime)

    // Update error rate based on recent logs
    const errorRate = Math.random() * 15
    this.updateMetric("error_rate", errorRate)
  }

  private recordHealthHistory(): void {
    const currentHealth = this.getSystemHealth()
    this.healthHistory.unshift({
      timestamp: new Date(),
      overall: currentHealth.overall,
      metrics: [...currentHealth.metrics],
    })

    // Keep only last 24 hours of history (288 records at 5-minute intervals)
    if (this.healthHistory.length > 288) {
      this.healthHistory = this.healthHistory.slice(0, 288)
    }
  }

  getSystemHealth(): SystemHealth {
    const metrics = Array.from(this.metrics.values())
    const services = Array.from(this.services.values())

    // Determine overall health
    let overall: SystemHealth["overall"] = "healthy"

    // Check metrics
    for (const metric of metrics) {
      if (metric.status === "critical") {
        overall = "critical"
        break
      } else if (metric.status === "warning" && overall === "healthy") {
        overall = "warning"
      }
    }

    // Check services
    for (const service of services) {
      if (service.status === "offline") {
        overall = "critical"
        break
      } else if (service.status === "degraded" && overall === "healthy") {
        overall = "warning"
      }
    }

    return {
      overall,
      metrics,
      services,
      lastCheck: new Date(),
    }
  }

  getHealthHistory(hours = 24): Array<{ timestamp: Date; overall: string; metrics: HealthMetric[] }> {
    const cutoffTime = new Date()
    cutoffTime.setHours(cutoffTime.getHours() - hours)

    return this.healthHistory.filter((record) => record.timestamp >= cutoffTime)
  }

  getMetricHistory(metricName: string, hours = 24): Array<{ timestamp: Date; value: number }> {
    const cutoffTime = new Date()
    cutoffTime.setHours(cutoffTime.getHours() - hours)

    return this.healthHistory
      .filter((record) => record.timestamp >= cutoffTime)
      .map((record) => {
        const metric = record.metrics.find((m) => m.name === metricName)
        return {
          timestamp: record.timestamp,
          value: metric?.value || 0,
        }
      })
  }

  // Alert thresholds
  getActiveAlerts(): Array<{
    type: "metric" | "service"
    name: string
    severity: "warning" | "critical"
    message: string
    timestamp: Date
  }> {
    const alerts: Array<{
      type: "metric" | "service"
      name: string
      severity: "warning" | "critical"
      message: string
      timestamp: Date
    }> = []

    // Check metrics
    for (const metric of this.metrics.values()) {
      if (metric.status === "critical") {
        alerts.push({
          type: "metric",
          name: metric.name,
          severity: "critical",
          message: `${metric.name} is at ${metric.value}${metric.unit} (critical threshold: ${metric.threshold.critical}${metric.unit})`,
          timestamp: metric.lastUpdated,
        })
      } else if (metric.status === "warning") {
        alerts.push({
          type: "metric",
          name: metric.name,
          severity: "warning",
          message: `${metric.name} is at ${metric.value}${metric.unit} (warning threshold: ${metric.threshold.warning}${metric.unit})`,
          timestamp: metric.lastUpdated,
        })
      }
    }

    // Check services
    for (const service of this.services.values()) {
      if (service.status === "offline") {
        alerts.push({
          type: "service",
          name: service.name,
          severity: "critical",
          message: `${service.name} is offline${service.error ? `: ${service.error}` : ""}`,
          timestamp: service.lastCheck,
        })
      } else if (service.status === "degraded") {
        alerts.push({
          type: "service",
          name: service.name,
          severity: "warning",
          message: `${service.name} is degraded${service.error ? `: ${service.error}` : ""}`,
          timestamp: service.lastCheck,
        })
      }
    }

    return alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  exportHealthData(): any {
    return {
      currentHealth: this.getSystemHealth(),
      healthHistory: this.getHealthHistory(),
      activeAlerts: this.getActiveAlerts(),
      exportedAt: new Date(),
    }
  }
}
