"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { useToast } from "@/components/ui/use-toast"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { FileText, Download, TrendingUp, DollarSign, Users, Briefcase } from "lucide-react"
import type { DateRange } from "react-day-picker"

interface ReportData {
  projectsByMonth: Array<{ month: string; count: number; value: number }>
  clientDistribution: Array<{ name: string; value: number; color: string }>
  priceMatchingAccuracy: Array<{ date: string; accuracy: number; volume: number }>
  revenueByCategory: Array<{ category: string; revenue: number; projects: number }>
  performanceMetrics: {
    totalProjects: number
    totalRevenue: number
    averageProjectValue: number
    matchingAccuracy: number
    clientSatisfaction: number
    completionRate: number
  }
}

export function AdvancedReports() {
  const { toast } = useToast()
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [reportType, setReportType] = useState("overview")
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth() - 6, 1),
    to: new Date(),
  })

  useEffect(() => {
    fetchReportData()
  }, [reportType, dateRange])

  const fetchReportData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append("type", reportType)
      if (dateRange?.from) params.append("from", dateRange.from.toISOString())
      if (dateRange?.to) params.append("to", dateRange.to.toISOString())

      const response = await fetch(`/api/reports/advanced?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setReportData(data)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch report data",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not connect to server",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const exportReport = async (format: "pdf" | "excel") => {
    try {
      const params = new URLSearchParams()
      params.append("type", reportType)
      params.append("format", format)
      if (dateRange?.from) params.append("from", dateRange.from.toISOString())
      if (dateRange?.to) params.append("to", dateRange.to.toISOString())

      const response = await fetch(`/api/reports/export?${params.toString()}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `report-${reportType}-${new Date().toISOString().split("T")[0]}.${format === "pdf" ? "pdf" : "xlsx"}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        toast({
          title: "Export Successful",
          description: `Report exported as ${format.toUpperCase()}`,
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export report",
        variant: "destructive",
      })
    }
  }

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-8 bg-muted rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Report Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Advanced Reports & Analytics
              </CardTitle>
              <CardDescription>Comprehensive business intelligence and performance metrics</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => exportReport("excel")}>
                <Download className="mr-2 h-4 w-4" />
                Export Excel
              </Button>
              <Button variant="outline" onClick={() => exportReport("pdf")}>
                <Download className="mr-2 h-4 w-4" />
                Export PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select Report Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overview">Business Overview</SelectItem>
                <SelectItem value="projects">Project Analysis</SelectItem>
                <SelectItem value="clients">Client Performance</SelectItem>
                <SelectItem value="pricing">Pricing Analytics</SelectItem>
                <SelectItem value="performance">Performance Metrics</SelectItem>
              </SelectContent>
            </Select>
            <DatePickerWithRange date={dateRange} onDateChange={setDateRange} />
          </div>
        </CardContent>
      </Card>

      {reportData && (
        <>
          {/* Key Performance Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{reportData.performanceMetrics.totalProjects}</div>
                <p className="text-xs text-muted-foreground">+12% from last period</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  ${reportData.performanceMetrics.totalRevenue.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">+8% from last period</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Project Value</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  ${reportData.performanceMetrics.averageProjectValue.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">+5% from last period</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Matching Accuracy</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">
                  {reportData.performanceMetrics.matchingAccuracy}%
                </div>
                <p className="text-xs text-muted-foreground">+2% from last period</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Projects & Revenue by Month</CardTitle>
                <CardDescription>Monthly project volume and revenue trends</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={reportData.projectsByMonth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Bar yAxisId="left" dataKey="count" fill="#8884d8" name="Projects" />
                    <Bar yAxisId="right" dataKey="value" fill="#82ca9d" name="Revenue ($)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Client Distribution</CardTitle>
                <CardDescription>Revenue distribution by client</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={reportData.clientDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {reportData.clientDistribution.map((entry, index) => (
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
                <CardTitle>Price Matching Performance</CardTitle>
                <CardDescription>Accuracy and volume trends over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={reportData.priceMatchingAccuracy}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Line yAxisId="left" type="monotone" dataKey="accuracy" stroke="#8884d8" name="Accuracy %" />
                    <Line yAxisId="right" type="monotone" dataKey="volume" stroke="#82ca9d" name="Volume" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue by Category</CardTitle>
                <CardDescription>Performance across different project categories</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={reportData.revenueByCategory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="revenue" fill="#8884d8" name="Revenue ($)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
