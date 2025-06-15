interface Notification {
  id: string
  userId: string
  type: "info" | "success" | "warning" | "error"
  title: string
  message: string
  data?: any
  read: boolean
  createdAt: Date
  expiresAt?: Date
}

interface SystemAlert {
  id: string
  type: "system" | "security" | "performance" | "maintenance"
  severity: "low" | "medium" | "high" | "critical"
  title: string
  message: string
  affectedUsers: string[]
  createdAt: Date
  resolvedAt?: Date
  actions?: Array<{
    label: string
    action: string
    variant?: "default" | "destructive"
  }>
}

export class NotificationService {
  private static instance: NotificationService
  private notifications: Map<string, Notification[]> = new Map()
  private systemAlerts: SystemAlert[] = []
  private subscribers: Map<string, (notifications: Notification[]) => void> = new Map()
  private alertSubscribers: Set<(alerts: SystemAlert[]) => void> = new Set()

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  // User Notifications
  addNotification(userId: string, notification: Omit<Notification, "id" | "userId" | "read" | "createdAt">): void {
    const newNotification: Notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      read: false,
      createdAt: new Date(),
      ...notification,
    }

    const userNotifications = this.notifications.get(userId) || []
    userNotifications.unshift(newNotification)

    // Keep only last 100 notifications per user
    if (userNotifications.length > 100) {
      userNotifications.splice(100)
    }

    this.notifications.set(userId, userNotifications)
    this.notifySubscriber(userId)
  }

  getUserNotifications(userId: string): Notification[] {
    return this.notifications.get(userId) || []
  }

  markAsRead(userId: string, notificationId: string): void {
    const userNotifications = this.notifications.get(userId) || []
    const notification = userNotifications.find((n) => n.id === notificationId)
    if (notification) {
      notification.read = true
      this.notifySubscriber(userId)
    }
  }

  markAllAsRead(userId: string): void {
    const userNotifications = this.notifications.get(userId) || []
    userNotifications.forEach((n) => (n.read = true))
    this.notifySubscriber(userId)
  }

  getUnreadCount(userId: string): number {
    const userNotifications = this.notifications.get(userId) || []
    return userNotifications.filter((n) => !n.read).length
  }

  // System Alerts
  addSystemAlert(alert: Omit<SystemAlert, "id" | "createdAt">): void {
    const newAlert: SystemAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      ...alert,
    }

    this.systemAlerts.unshift(newAlert)

    // Keep only last 50 alerts
    if (this.systemAlerts.length > 50) {
      this.systemAlerts.splice(50)
    }

    // Notify affected users
    for (const userId of alert.affectedUsers) {
      this.addNotification(userId, {
        type: alert.severity === "critical" ? "error" : alert.severity === "high" ? "warning" : "info",
        title: `System Alert: ${alert.title}`,
        message: alert.message,
        data: { alertId: newAlert.id },
      })
    }

    this.notifyAlertSubscribers()
  }

  resolveSystemAlert(alertId: string): void {
    const alert = this.systemAlerts.find((a) => a.id === alertId)
    if (alert) {
      alert.resolvedAt = new Date()
      this.notifyAlertSubscribers()
    }
  }

  getActiveAlerts(): SystemAlert[] {
    return this.systemAlerts.filter((a) => !a.resolvedAt)
  }

  getAllAlerts(): SystemAlert[] {
    return this.systemAlerts
  }

  // Subscriptions
  subscribe(userId: string, callback: (notifications: Notification[]) => void): () => void {
    this.subscribers.set(userId, callback)
    return () => this.subscribers.delete(userId)
  }

  subscribeToAlerts(callback: (alerts: SystemAlert[]) => void): () => void {
    this.alertSubscribers.add(callback)
    return () => this.alertSubscribers.delete(callback)
  }

  private notifySubscriber(userId: string): void {
    const callback = this.subscribers.get(userId)
    if (callback) {
      callback(this.getUserNotifications(userId))
    }
  }

  private notifyAlertSubscribers(): void {
    const alerts = this.getActiveAlerts()
    this.alertSubscribers.forEach((callback) => callback(alerts))
  }

  // Predefined notification templates
  notifyJobCompleted(userId: string, jobId: string, jobName: string, itemCount: number): void {
    this.addNotification(userId, {
      type: "success",
      title: "Job Completed",
      message: `${jobName} has been completed successfully. Processed ${itemCount} items.`,
      data: { jobId, type: "job_completed" },
    })
  }

  notifyJobFailed(userId: string, jobId: string, jobName: string, error: string): void {
    this.addNotification(userId, {
      type: "error",
      title: "Job Failed",
      message: `${jobName} failed to complete: ${error}`,
      data: { jobId, type: "job_failed" },
    })
  }

  notifyLowConfidenceMatches(userId: string, jobId: string, lowConfidenceCount: number): void {
    this.addNotification(userId, {
      type: "warning",
      title: "Low Confidence Matches",
      message: `${lowConfidenceCount} items have low confidence matches and may need manual review.`,
      data: { jobId, type: "low_confidence" },
    })
  }

  notifySystemMaintenance(affectedUsers: string[], startTime: Date, duration: string): void {
    this.addSystemAlert({
      type: "maintenance",
      severity: "medium",
      title: "Scheduled Maintenance",
      message: `System maintenance scheduled for ${startTime.toLocaleString()}. Expected duration: ${duration}`,
      affectedUsers,
      actions: [
        { label: "View Details", action: "view_maintenance" },
        { label: "Subscribe to Updates", action: "subscribe_updates" },
      ],
    })
  }

  notifyHighApiUsage(affectedUsers: string[], usage: number, limit: number): void {
    this.addSystemAlert({
      type: "performance",
      severity: "high",
      title: "High API Usage",
      message: `API usage is at ${usage}% of the monthly limit (${limit} requests). Consider upgrading your plan.`,
      affectedUsers,
      actions: [
        { label: "Upgrade Plan", action: "upgrade_plan" },
        { label: "View Usage", action: "view_usage" },
      ],
    })
  }
}
