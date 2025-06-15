"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  FileText,
  MoreHorizontal,
  Eye,
  EyeOff,
  RefreshCw,
  Maximize2,
  Settings,
  Building,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Widget {
  id: string
  title: string
  type: "metric" | "chart" | "list" | "progress" | "activity"
  size: "small" | "medium" | "large"
  visible: boolean
  data: any
  refreshable?: boolean
  expandable?: boolean
}

interface DashboardWidgetsProps {
  widgets: Widget[]
  onWidgetUpdate?: (widgets: Widget[]) => void
  onWidgetRefresh?: (widgetId: string) => void
  className?: string
}

export function DashboardWidgets({
  widgets: initialWidgets,
  onWidgetUpdate,
  onWidgetRefresh,
  className,
}: DashboardWidgetsProps) {
  const [widgets, setWidgets] = useState<Widget[]>(initialWidgets)
  const [refreshing, setRefreshing] = useState<string[]>([])

  const toggleWidgetVisibility = (widgetId: string) => {
    const updatedWidgets = widgets.map((widget) =>
      widget.id === widgetId ? { ...widget, visible: !widget.visible } : widget,
    )
    setWidgets(updatedWidgets)
    onWidgetUpdate?.(updatedWidgets)
  }

  const refreshWidget = async (widgetId: string) => {
    setRefreshing((prev) => [...prev, widgetId])
    await onWidgetRefresh?.(widgetId)
    setTimeout(() => {
      setRefreshing((prev) => prev.filter((id) => id !== widgetId))
    }, 1000)
  }

  const getWidgetSize = (size: string) => {
    switch (size) {
      case "small":
        return "col-span-1"
      case "medium":
        return "col-span-2"
      case "large":
        return "col-span-3"
      default:
        return "col-span-1"
    }
  }

  const MetricWidget = ({ widget }: { widget: Widget }) => {
    const { title, data } = widget
    const { value, change, icon: IconComponent, format = "number", color = "blue" } = data

    const formatValue = (val: number) => {
      switch (format) {
        case "currency":
          return `$${val.toLocaleString()}`
        case "percentage":
          return `${val}%`
        default:
          return val.toLocaleString()
      }
    }

    const colorClasses = {
      blue: "text-blue-600 bg-blue-100",
      green: "text-green-600 bg-green-100",
      purple: "text-purple-600 bg-purple-100",
      orange: "text-orange-600 bg-orange-100",
      red: "text-red-600 bg-red-100",
    }

    return (
      <Card className="card-shadow hover:shadow-lg transition-all duration-300 floating">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <p className="text-3xl font-bold mt-2">{formatValue(value)}</p>
              {change !== undefined && (
                <div className="flex items-center mt-2">
                  {change >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                  )}
                  <span className={cn("text-sm font-medium", change >= 0 ? "text-green-600" : "text-red-600")}>
                    {change >= 0 ? "+" : ""}
                    {change}%
                  </span>
                  <span className="text-sm text-muted-foreground ml-1">vs last period</span>
                </div>
              )}
            </div>
            <div className={cn("p-3 rounded-full", colorClasses[color as keyof typeof colorClasses])}>
              <IconComponent className="h-6 w-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const ProgressWidget = ({ widget }: { widget: Widget }) => {
    const { title, data } = widget
    const { items } = data

    return (
      <Card className="card-shadow hover:shadow-lg transition-all duration-300">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item: any, index: number) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{item.label}</span>
                <span className="text-muted-foreground">
                  {item.current}/{item.total}
                </span>
              </div>
              <Progress value={(item.current / item.total) * 100} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  const ActivityWidget = ({ widget }: { widget: Widget }) => {
    const { title, data } = widget
    const { activities } = data

    return (
      <Card className="card-shadow hover:shadow-lg transition-all duration-300">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-64 overflow-y-auto">
            {activities.map((activity: any, index: number) => (
              <div key={index} className="flex items-start gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={activity.avatar || "/placeholder.svg"} />
                  <AvatarFallback>{activity.user.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">{activity.user}</span> {activity.action}
                  </p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
                {activity.status && (
                  <Badge variant={activity.status === "success" ? "default" : "secondary"} className="text-xs">
                    {activity.status}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const ListWidget = ({ widget }: { widget: Widget }) => {
    const { title, data } = widget
    const { items, showMore } = data

    return (
      <Card className="card-shadow hover:shadow-lg transition-all duration-300">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {items.map((item: any, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 hover:bg-gray-50 rounded transition-colors"
              >
                <div className="flex items-center gap-3">
                  {item.icon && <item.icon className="h-4 w-4 text-gray-500" />}
                  <div>
                    <p className="font-medium text-sm">{item.title}</p>
                    {item.subtitle && <p className="text-xs text-muted-foreground">{item.subtitle}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {item.value && <span className="text-sm font-medium">{item.value}</span>}
                  {item.status && (
                    <Badge variant={item.status === "active" ? "default" : "secondary"} className="text-xs">
                      {item.status}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
            {showMore && (
              <Button variant="ghost" size="sm" className="w-full mt-2">
                View All
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderWidget = (widget: Widget) => {
    if (!widget.visible) return null

    const isRefreshing = refreshing.includes(widget.id)

    const WidgetWrapper = ({ children }: { children: React.ReactNode }) => (
      <div className={cn("relative", getWidgetSize(widget.size))}>
        {children}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 bg-white/80 hover:bg-white">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="shadow-xl">
              {widget.refreshable && (
                <DropdownMenuItem onClick={() => refreshWidget(widget.id)} disabled={isRefreshing}>
                  <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
                  Refresh
                </DropdownMenuItem>
              )}
              {widget.expandable && (
                <DropdownMenuItem>
                  <Maximize2 className="h-4 w-4 mr-2" />
                  Expand
                </DropdownMenuItem>
              )}
              <DropdownMenuItem>
                <Settings className="h-4 w-4 mr-2" />
                Configure
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => toggleWidgetVisibility(widget.id)}>
                <EyeOff className="h-4 w-4 mr-2" />
                Hide Widget
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    )

    return (
      <WidgetWrapper key={widget.id}>
        <div className="group h-full">
          {widget.type === "metric" && <MetricWidget widget={widget} />}
          {widget.type === "progress" && <ProgressWidget widget={widget} />}
          {widget.type === "activity" && <ActivityWidget widget={widget} />}
          {widget.type === "list" && <ListWidget widget={widget} />}
        </div>
      </WidgetWrapper>
    )
  }

  const hiddenWidgets = widgets.filter((w) => !w.visible)

  return (
    <div className={cn("space-y-6", className)}>
      {/* Widget Controls */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <div className="flex items-center gap-2">
          {hiddenWidgets.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="btn-secondary">
                  <Eye className="h-4 w-4 mr-2" />
                  Show Widgets ({hiddenWidgets.length})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 shadow-xl">
                {hiddenWidgets.map((widget) => (
                  <DropdownMenuItem key={widget.id} onClick={() => toggleWidgetVisibility(widget.id)}>
                    <Eye className="h-4 w-4 mr-2" />
                    {widget.title}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => widgets.forEach((w) => w.refreshable && refreshWidget(w.id))}
            className="btn-secondary"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh All
          </Button>
        </div>
      </div>

      {/* Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
        {widgets.map(renderWidget)}
      </div>
    </div>
  )
}

// Example widget data
export const sampleWidgets: Widget[] = [
  {
    id: "revenue",
    title: "Total Revenue",
    type: "metric",
    size: "small",
    visible: true,
    refreshable: true,
    data: {
      value: 245000,
      change: 12.5,
      icon: DollarSign,
      format: "currency",
      color: "green",
    },
  },
  {
    id: "projects",
    title: "Active Projects",
    type: "metric",
    size: "small",
    visible: true,
    refreshable: true,
    data: {
      value: 48,
      change: 8.3,
      icon: FileText,
      color: "blue",
    },
  },
  {
    id: "clients",
    title: "Active Clients",
    type: "metric",
    size: "small",
    visible: true,
    refreshable: true,
    data: {
      value: 23,
      change: 15.2,
      icon: Users,
      color: "purple",
    },
  },
  {
    id: "project-progress",
    title: "Project Progress",
    type: "progress",
    size: "medium",
    visible: true,
    refreshable: true,
    data: {
      items: [
        { label: "Office Complex", current: 75, total: 100 },
        { label: "Residential Tower", current: 45, total: 100 },
        { label: "Shopping Mall", current: 90, total: 100 },
      ],
    },
  },
  {
    id: "recent-activity",
    title: "Recent Activity",
    type: "activity",
    size: "medium",
    visible: true,
    refreshable: true,
    data: {
      activities: [
        {
          user: "John Smith",
          action: "completed price matching for Project Alpha",
          time: "2 minutes ago",
          status: "success",
          avatar: "/avatars/john.jpg",
        },
        {
          user: "Sarah Johnson",
          action: "uploaded new BOQ file",
          time: "15 minutes ago",
          status: "pending",
          avatar: "/avatars/sarah.jpg",
        },
        {
          user: "Mike Wilson",
          action: "created new client profile",
          time: "1 hour ago",
          status: "success",
          avatar: "/avatars/mike.jpg",
        },
      ],
    },
  },
  {
    id: "top-clients",
    title: "Top Clients",
    type: "list",
    size: "small",
    visible: true,
    refreshable: true,
    data: {
      items: [
        { title: "Construction Corp", subtitle: "12 projects", value: "$125K", status: "active", icon: Building },
        { title: "BuildTech Ltd", subtitle: "8 projects", value: "$89K", status: "active", icon: Building },
        { title: "MegaBuild Inc", subtitle: "5 projects", value: "$67K", status: "pending", icon: Building },
      ],
      showMore: true,
    },
  },
]
