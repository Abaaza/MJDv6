"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Users, Briefcase, DollarSign, TrendingUp, FileText, Clock, CheckCircle } from "lucide-react"

interface DashboardStats {
  totalClients: number
  activeProjects: number
  totalRevenue: number
  completedJobs: number
  pendingJobs: number
  recentActivity: Array<{
    id: string
    type: string
    message: string
    time: string
    status: "success" | "warning" | "info"
  }>
}

interface MobileDashboardProps {
  stats: DashboardStats
}

export function MobileDashboard({ stats }: MobileDashboardProps) {
  const quickStats = [
    {
      title: "Clients",
      value: stats.totalClients,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Projects",
      value: stats.activeProjects,
      icon: Briefcase,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Revenue",
      value: `$${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Completed",
      value: stats.completedJobs,
      icon: CheckCircle,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
  ]

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "project":
        return Briefcase
      case "client":
        return Users
      case "match":
        return FileText
      default:
        return Clock
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "text-green-600"
      case "warning":
        return "text-yellow-600"
      case "info":
        return "text-blue-600"
      default:
        return "text-gray-600"
    }
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {quickStats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-xl font-bold">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Job Progress */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Job Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Completed Jobs</span>
              <span>
                {stats.completedJobs}/{stats.completedJobs + stats.pendingJobs}
              </span>
            </div>
            <Progress value={(stats.completedJobs / (stats.completedJobs + stats.pendingJobs)) * 100} className="h-2" />
          </div>

          <div className="flex justify-between pt-2">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.completedJobs}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{stats.pendingJobs}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.recentActivity.slice(0, 5).map((activity) => {
              const ActivityIcon = getActivityIcon(activity.type)
              return (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="p-1.5 rounded-full bg-muted">
                    <ActivityIcon className={`h-3 w-3 ${getStatusColor(activity.status)}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-2">{activity.message}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              )
            })}
          </div>

          <Button variant="outline" size="sm" className="w-full mt-4">
            View All Activity
          </Button>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" size="sm" className="h-auto py-3 flex flex-col">
              <Users className="h-4 w-4 mb-1" />
              <span className="text-xs">New Client</span>
            </Button>
            <Button variant="outline" size="sm" className="h-auto py-3 flex flex-col">
              <Briefcase className="h-4 w-4 mb-1" />
              <span className="text-xs">New Project</span>
            </Button>
            <Button variant="outline" size="sm" className="h-auto py-3 flex flex-col">
              <FileText className="h-4 w-4 mb-1" />
              <span className="text-xs">Price Match</span>
            </Button>
            <Button variant="outline" size="sm" className="h-auto py-3 flex flex-col">
              <TrendingUp className="h-4 w-4 mb-1" />
              <span className="text-xs">Analytics</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
