"use client"

import type React from "react"
import { useState, createContext, useContext, useCallback, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, CheckCircle, AlertTriangle, Info, AlertCircle, Bell } from "lucide-react"
import { cn } from "@/lib/utils"

interface Notification {
  id: string
  type: "success" | "warning" | "error" | "info"
  title: string
  message: string
  timestamp: Date
  read: boolean
  action?: {
    label: string
    onClick: () => void
  }
  autoClose?: boolean
  duration?: number
}

interface NotificationContextType {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, "id" | "timestamp" | "read">) => void
  markAsRead: (id: string) => void
  removeNotification: (id: string) => void
  clearAll: () => void
  unreadCount: number
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const addNotification = useCallback(
    (notification: Omit<Notification, "id" | "timestamp" | "read">) => {
      if (!mounted) return

      const newNotification: Notification = {
        ...notification,
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date(),
        read: false,
      }

      setNotifications((prev) => [newNotification, ...prev])

      // Auto-close if specified
      if (notification.autoClose !== false) {
        const duration = notification.duration || 5000
        setTimeout(() => {
          removeNotification(newNotification.id)
        }, duration)
      }
    },
    [mounted],
  )

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  const unreadCount = notifications.filter((n) => !n.read).length

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        markAsRead,
        removeNotification,
        clearAll,
        unreadCount,
      }}
    >
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    // Return safe defaults instead of throwing
    return {
      notifications: [],
      addNotification: () => {},
      markAsRead: () => {},
      removeNotification: () => {},
      clearAll: () => {},
      unreadCount: 0,
    }
  }
  return context
}

function NotificationContainer() {
  const { notifications, markAsRead, removeNotification } = useNotifications()

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-600" />
      default:
        return <Info className="h-5 w-5 text-blue-600" />
    }
  }

  const getStyles = (type: string) => {
    switch (type) {
      case "success":
        return "border-l-green-500 bg-green-50 shadow-green-100"
      case "warning":
        return "border-l-yellow-500 bg-yellow-50 shadow-yellow-100"
      case "error":
        return "border-l-red-500 bg-red-50 shadow-red-100"
      default:
        return "border-l-blue-500 bg-blue-50 shadow-blue-100"
    }
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {notifications.slice(0, 5).map((notification) => (
        <Card
          key={notification.id}
          className={cn(
            "border-l-4 shadow-lg hover:shadow-xl transition-all duration-300 animate-slide-up",
            getStyles(notification.type),
            !notification.read && "ring-2 ring-blue-200",
          )}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              {getIcon(notification.type)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">{notification.title}</h4>
                  <div className="flex items-center gap-2">
                    {!notification.read && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeNotification(notification.id)}
                      className="h-6 w-6 p-0 hover:bg-gray-200"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-500">{notification.timestamp.toLocaleTimeString()}</span>
                  {notification.action && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        notification.action?.onClick()
                        markAsRead(notification.id)
                      }}
                      className="h-6 text-xs"
                    >
                      {notification.action.label}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" className="relative hover:bg-gray-100 transition-colors">
        <Bell className="h-5 w-5" />
      </Button>
    )
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative hover:bg-gray-100 transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs bg-red-500 hover:bg-red-500">
            {unreadCount > 9 ? "9+" : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <Card className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto shadow-xl border z-50 animate-scale-in">
          <CardContent className="p-0">
            <div className="p-4 border-b bg-gray-50">
              <h3 className="font-semibold">Notifications</h3>
              {unreadCount > 0 && <p className="text-sm text-gray-600">{unreadCount} unread</p>}
            </div>
            <div className="max-h-64 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No notifications</p>
                </div>
              ) : (
                notifications.slice(0, 10).map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-3 border-b hover:bg-gray-50 cursor-pointer transition-colors",
                      !notification.read && "bg-blue-50",
                    )}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-2">
                      {getIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm">{notification.title}</h4>
                        <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                        <span className="text-xs text-gray-500">{notification.timestamp.toLocaleString()}</span>
                      </div>
                      {!notification.read && <div className="w-2 h-2 bg-blue-500 rounded-full mt-1" />}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function getIcon(type: string) {
  switch (type) {
    case "success":
      return <CheckCircle className="h-4 w-4 text-green-600" />
    case "warning":
      return <AlertTriangle className="h-4 w-4 text-yellow-600" />
    case "error":
      return <AlertCircle className="h-4 w-4 text-red-600" />
    default:
      return <Info className="h-4 w-4 text-blue-600" />
  }
}

// Export NotificationSystem as a named export for compatibility
export const NotificationSystem = NotificationProvider
