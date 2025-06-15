interface AuditLog {
  id: string
  userId: string
  userEmail: string
  action: string
  resource: string
  resourceId?: string
  details: any
  ipAddress?: string
  userAgent?: string
  timestamp: Date
  severity: "low" | "medium" | "high" | "critical"
  category: "auth" | "data" | "system" | "security" | "api"
}

interface AuditQuery {
  userId?: string
  action?: string
  resource?: string
  category?: string
  severity?: string
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}

export class AuditService {
  private static instance: AuditService
  private logs: AuditLog[] = []
  private maxLogs = 10000 // Keep last 10k logs in memory

  static getInstance(): AuditService {
    if (!AuditService.instance) {
      AuditService.instance = new AuditService()
    }
    return AuditService.instance
  }

  log(entry: Omit<AuditLog, "id" | "timestamp">): void {
    const auditLog: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...entry,
    }

    this.logs.unshift(auditLog)

    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs)
    }

    // Log critical events to console
    if (entry.severity === "critical") {
      console.warn("CRITICAL AUDIT EVENT:", auditLog)
    }
  }

  query(query: AuditQuery = {}): AuditLog[] {
    let filteredLogs = this.logs

    if (query.userId) {
      filteredLogs = filteredLogs.filter((log) => log.userId === query.userId)
    }

    if (query.action) {
      filteredLogs = filteredLogs.filter((log) => log.action.toLowerCase().includes(query.action!.toLowerCase()))
    }

    if (query.resource) {
      filteredLogs = filteredLogs.filter((log) => log.resource.toLowerCase().includes(query.resource!.toLowerCase()))
    }

    if (query.category) {
      filteredLogs = filteredLogs.filter((log) => log.category === query.category)
    }

    if (query.severity) {
      filteredLogs = filteredLogs.filter((log) => log.severity === query.severity)
    }

    if (query.startDate) {
      filteredLogs = filteredLogs.filter((log) => log.timestamp >= query.startDate!)
    }

    if (query.endDate) {
      filteredLogs = filteredLogs.filter((log) => log.timestamp <= query.endDate!)
    }

    // Apply pagination
    const offset = query.offset || 0
    const limit = query.limit || 100

    return filteredLogs.slice(offset, offset + limit)
  }

  getLogById(id: string): AuditLog | null {
    return this.logs.find((log) => log.id === id) || null
  }

  // Predefined audit methods
  logUserLogin(userId: string, userEmail: string, ipAddress?: string, userAgent?: string): void {
    this.log({
      userId,
      userEmail,
      action: "user_login",
      resource: "authentication",
      details: { loginTime: new Date() },
      ipAddress,
      userAgent,
      severity: "low",
      category: "auth",
    })
  }

  logUserLogout(userId: string, userEmail: string): void {
    this.log({
      userId,
      userEmail,
      action: "user_logout",
      resource: "authentication",
      details: { logoutTime: new Date() },
      severity: "low",
      category: "auth",
    })
  }

  logFailedLogin(email: string, ipAddress?: string, userAgent?: string): void {
    this.log({
      userId: "anonymous",
      userEmail: email,
      action: "failed_login",
      resource: "authentication",
      details: { attemptedEmail: email, failureTime: new Date() },
      ipAddress,
      userAgent,
      severity: "medium",
      category: "security",
    })
  }

  logDataAccess(userId: string, userEmail: string, resource: string, resourceId: string, action: string): void {
    this.log({
      userId,
      userEmail,
      action,
      resource,
      resourceId,
      details: { accessTime: new Date() },
      severity: "low",
      category: "data",
    })
  }

  logDataModification(
    userId: string,
    userEmail: string,
    resource: string,
    resourceId: string,
    action: string,
    changes: any,
  ): void {
    this.log({
      userId,
      userEmail,
      action,
      resource,
      resourceId,
      details: { changes, modificationTime: new Date() },
      severity: "medium",
      category: "data",
    })
  }

  logSystemEvent(
    userId: string,
    userEmail: string,
    action: string,
    details: any,
    severity: AuditLog["severity"],
  ): void {
    this.log({
      userId,
      userEmail,
      action,
      resource: "system",
      details,
      severity,
      category: "system",
    })
  }

  logApiCall(
    userId: string,
    userEmail: string,
    endpoint: string,
    method: string,
    statusCode: number,
    responseTime: number,
  ): void {
    this.log({
      userId,
      userEmail,
      action: `api_${method.toLowerCase()}`,
      resource: endpoint,
      details: {
        method,
        statusCode,
        responseTime,
        callTime: new Date(),
      },
      severity: statusCode >= 400 ? "medium" : "low",
      category: "api",
    })
  }

  logSecurityEvent(userId: string, userEmail: string, event: string, details: any): void {
    this.log({
      userId,
      userEmail,
      action: event,
      resource: "security",
      details,
      severity: "high",
      category: "security",
    })
  }

  // Analytics
  getLogStats(days = 30): {
    totalLogs: number
    logsByCategory: Record<string, number>
    logsBySeverity: Record<string, number>
    topUsers: Array<{ userId: string; userEmail: string; count: number }>
    topActions: Array<{ action: string; count: number }>
  } {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    const recentLogs = this.logs.filter((log) => log.timestamp >= cutoffDate)

    const logsByCategory: Record<string, number> = {}
    const logsBySeverity: Record<string, number> = {}
    const userCounts: Record<string, { userEmail: string; count: number }> = {}
    const actionCounts: Record<string, number> = {}

    for (const log of recentLogs) {
      // Category stats
      logsByCategory[log.category] = (logsByCategory[log.category] || 0) + 1

      // Severity stats
      logsBySeverity[log.severity] = (logsBySeverity[log.severity] || 0) + 1

      // User stats
      if (!userCounts[log.userId]) {
        userCounts[log.userId] = { userEmail: log.userEmail, count: 0 }
      }
      userCounts[log.userId].count++

      // Action stats
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1
    }

    const topUsers = Object.entries(userCounts)
      .map(([userId, data]) => ({ userId, userEmail: data.userEmail, count: data.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    const topActions = Object.entries(actionCounts)
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return {
      totalLogs: recentLogs.length,
      logsByCategory,
      logsBySeverity,
      topUsers,
      topActions,
    }
  }

  exportLogs(query: AuditQuery = {}): string {
    const logs = this.query(query)
    const headers = ["Timestamp", "User", "Action", "Resource", "Severity", "Category", "Details"]

    const csvContent = [
      headers.join(","),
      ...logs.map((log) =>
        [
          log.timestamp.toISOString(),
          `"${log.userEmail}"`,
          `"${log.action}"`,
          `"${log.resource}"`,
          log.severity,
          log.category,
          `"${JSON.stringify(log.details).replace(/"/g, '""')}"`,
        ].join(","),
      ),
    ].join("\n")

    return csvContent
  }
}
