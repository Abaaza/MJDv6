"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  BarChart,
  Bar,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts"
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  FileText,
  Zap,
  Target,
  Clock,
  Award,
  AlertTriangle,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface AnalyticsData {
  overview: {
    totalRevenue: number
    revenueGrowth: number
    totalProjects: number
    projectsGrowth: number
    activeClients: number
    clientsGrowth: number
    avgMatchAccuracy: number
    accuracyGrowth: number
  }
  revenueChart: Array<{
    month: string
    revenue: number
    projects: number
    target: number
  }>
  projectStatusChart: Array<{
    status: string
    count: number
    color: string
  }>
  clientActivityChart: Array<{
    date: string
    newClients: number
    activeClients: number
  }>
  matchingPerformance: Array<{
    model: string
    accuracy: number
    speed: number
    usage: number
  }>
  topPerformers: Array<{
    name: string
    metric: string
    value: number
    change: number
  }>
}

export function AdvancedAnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("30d")
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadAnalyticsData()
  }, [timeRange])

  const loadAnalyticsData = async () => {
    try {
      setRefreshing(true)
      console.log("📊 Loading analytics data...")

      // Simulate API call with mock data
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const mockData: AnalyticsData = {
        overview: {
          totalRevenue: 245000,
          revenueGrowth: 12.5,
          totalProjects: 48,
          projectsGrowth: 8.3,
          activeClients: 23,
          clientsGrowth: 15.2,
          avgMatchAccuracy: 87.4,
          accuracyGrowth: 3.1,
        },
        revenueChart: [
          { month: "Jan", revenue: 18000, projects: 4, target: 20000 },
          { month: "Feb", revenue: 22000, projects: 5, target: 20000 },
          { month: "Mar", revenue: 19500, projects: 3, target: 20000 },
          { month: "Apr", revenue: 25000, projects: 6, target: 22000 },
          { month: "May", revenue: 28000, projects: 7, target: 25000 },
          { month: "Jun", revenue: 32000, projects: 8, target: 28000 },
        ],
        projectStatusChart: [
          { status: "Active", count: 18, color: "#3b82f6" },
          { status: "Completed", count: 24, color: "#10b981" },
          { status: "On Hold", count: 4, color: "#f59e0b" },
          { status: "Cancelled", count: 2, color: "#ef4444" },
        ],
        clientActivityChart: [
          { date: "Week 1", newClients: 2, activeClients: 18 },
          { date: "Week 2", newClients: 3, activeClients: 20 },
          { date: "Week 3", newClients: 1, activeClients: 19 },
          { date: "Week 4", newClients: 4, activeClients: 23 },
        ],
        matchingPerformance: [
          { model: "Cohere v0", accuracy: 89, speed: 2.3, usage: 45 },
          { model: "OpenAI v1", accuracy: 92, speed: 3.1, usage: 35 },
          { model: "Hybrid v2", accuracy: 94, speed: 2.8, usage: 20 },
        ],
        topPerformers: [
          { name: "Construction Corp", metric: "Revenue", value: 45000, change: 15.2 },
          { name: "AI Matching", metric: "Accuracy", value: 94.2, change: 8.1 },
          { name: "Project Delta", metric: "Completion", value: 98, change: 12.5 },
          { name: "Client Retention", metric: "Rate", value: 96.8, change: 5.3 },
        ],
      }

      setData(mockData)
      console.log("✅ Analytics data loaded")
    } catch (error) {
      console.error("❌ Failed to load analytics:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const MetricCard = ({
    title,
    value,
    change,
    icon: Icon,
    format = "number",
    color = "blue",
  }: {
    title: string
    value: number
    change: number
    icon: any
    format?: "number" | "currency" | "percentage"
    color?: "blue" | "green" | "purple" | "orange"
  }) => {
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
    }

    return (
      <Card className="card-shadow hover:shadow-lg transition-all duration-300 floating">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <p className="text-3xl font-bold mt-2">{formatValue(value)}</p>
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
            </div>
            <div className={cn("p-3 rounded-full", colorClasses[color])}>
              <Icon className="h-6 w-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="card-shadow">
              <CardContent className="p-6">
                <div className="loading-shimmer h-20 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="card-shadow">
          <CardContent className="p-6">
            <div className="loading-shimmer h-64 rounded"></div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
          <p className="text-muted-foreground">Comprehensive insights into your business performance</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32 form-input">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="shadow-xl">
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={loadAnalyticsData} disabled={refreshing} variant="outline" className="btn-secondary">
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Revenue"
          value={data.overview.totalRevenue}
          change={data.overview.revenueGrowth}
          icon={DollarSign}
          format="currency"
          color="green"
        />
        <MetricCard
          title="Active Projects"
          value={data.overview.totalProjects}
          change={data.overview.projectsGrowth}
          icon={FileText}
          color="blue"
        />
        <MetricCard
          title="Active Clients"
          value={data.overview.activeClients}
          change={data.overview.clientsGrowth}
          icon={Users}
          color="purple"
        />
        <MetricCard
          title="Match Accuracy"
          value={data.overview.avgMatchAccuracy}
          change={data.overview.accuracyGrowth}
          icon={Target}
          format="percentage"
          color="orange"
        />
      </div>

      <Tabs defaultValue="revenue" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="revenue">Revenue & Projects</TabsTrigger>
          <TabsTrigger value="clients">Client Activity</TabsTrigger>
          <TabsTrigger value="performance">AI Performance</TabsTrigger>
          <TabsTrigger value="insights">Key Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2 card-shadow-lg">
              <CardHeader>
                <CardTitle>Revenue & Project Trends</CardTitle>
                <CardDescription>Monthly revenue and project completion tracking</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={data.revenueChart}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip
                      formatter={(value, name) => [
                        name === "revenue" ? `$${value.toLocaleString()}` : value,
                        name === "revenue" ? "Revenue" : name === "target" ? "Target" : "Projects",
                      ]}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stackId="1"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.6}
                    />
                    <Line type="monotone" dataKey="target" stroke="#ef4444" strokeDasharray="5 5" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="card-shadow-lg">
              <CardHeader>
                <CardTitle>Project Status</CardTitle>
                <CardDescription>Current project distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.projectStatusChart}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="count"
                      label={({ status, count }) => `${status}: ${count}`}
                    >
                      {data.projectStatusChart.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="clients" className="space-y-6">
          <Card className="card-shadow-lg">
            <CardHeader>
              <CardTitle>Client Activity Trends</CardTitle>
              <CardDescription>New client acquisition and activity patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={data.clientActivityChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="newClients" fill="#10b981" name="New Clients" />
                  <Bar dataKey="activeClients" fill="#3b82f6" name="Active Clients" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="card-shadow-lg">
              <CardHeader>
                <CardTitle>AI Model Performance</CardTitle>
                <CardDescription>Accuracy and speed comparison</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.matchingPerformance.map((model, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{model.model}</span>
                        <Badge variant="secondary">{model.accuracy}% accuracy</Badge>
                      </div>
                      <Progress value={model.accuracy} className="h-2" />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Speed: {model.speed}s avg</span>
                        <span>Usage: {model.usage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="card-shadow-lg">
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-green-600" />
                      <span className="font-medium">Success Rate</span>
                    </div>
                    <span className="text-2xl font-bold text-green-600">94.2%</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-blue-600" />
                      <span className="font-medium">Avg Processing Time</span>
                    </div>
                    <span className="text-2xl font-bold text-blue-600">2.8s</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-purple-600" />
                      <span className="font-medium">Daily Matches</span>
                    </div>
                    <span className="text-2xl font-bold text-purple-600">1,247</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="card-shadow-lg">
              <CardHeader>
                <CardTitle>Top Performers</CardTitle>
                <CardDescription>Best performing metrics this period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.topPerformers.map((performer, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div>
                        <h4 className="font-medium">{performer.name}</h4>
                        <p className="text-sm text-muted-foreground">{performer.metric}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">
                          {performer.metric === "Revenue"
                            ? `$${performer.value.toLocaleString()}`
                            : performer.metric === "Accuracy" || performer.metric === "Rate"
                              ? `${performer.value}%`
                              : performer.value}
                        </div>
                        <div
                          className={cn(
                            "text-sm flex items-center",
                            performer.change >= 0 ? "text-green-600" : "text-red-600",
                          )}
                        >
                          {performer.change >= 0 ? (
                            <TrendingUp className="h-3 w-3 mr-1" />
                          ) : (
                            <TrendingDown className="h-3 w-3 mr-1" />
                          )}
                          {performer.change >= 0 ? "+" : ""}
                          {performer.change}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="card-shadow-lg">
              <CardHeader>
                <CardTitle>Key Insights</CardTitle>
                <CardDescription>AI-generated business insights</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                    <div className="flex items-start gap-2">
                      <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-900">Revenue Growth</h4>
                        <p className="text-sm text-blue-700">
                          Revenue increased by 12.5% this month, driven by 3 major project completions.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                    <div className="flex items-start gap-2">
                      <Target className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-green-900">AI Performance</h4>
                        <p className="text-sm text-green-700">
                          Hybrid model showing 94% accuracy - consider increasing usage for better results.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-yellow-900">Attention Needed</h4>
                        <p className="text-sm text-yellow-700">
                          4 projects are on hold - review and take action to maintain momentum.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
