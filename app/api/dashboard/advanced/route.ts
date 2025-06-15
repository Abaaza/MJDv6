import { type NextRequest, NextResponse } from "next/server"
import { MongoDBService } from "@/lib/mongodb-service"

export async function GET(request: NextRequest) {
  console.log("📊 === ADVANCED DASHBOARD API (NO AUTH) ===")

  try {
    const { searchParams } = new URL(request.url)
    const range = searchParams.get("range") || "7d"

    const now = new Date()
    const daysBack = range === "7d" ? 7 : range === "30d" ? 30 : 90
    const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000)

    const [projects, clients, priceItems] = await Promise.all([
      MongoDBService.getProjects({ page: 1, limit: 1000 }),
      MongoDBService.getClients({ page: 1, limit: 1000 }),
      MongoDBService.getPriceItems({ page: 1, limit: 100 }),
    ])

    const totalProjects = projects.projects.length
    const activeProjects = projects.projects.filter((p) => p.status === "new" || p.status === "matching").length
    const completedProjects = projects.projects.filter((p) => p.status === "complete").length
    const totalClients = clients.clients.length

    const totalRevenue = totalProjects * 15000 + Math.random() * 50000
    const avgProjectValue = totalRevenue / Math.max(totalProjects, 1)

    const projectsByStatus = [
      { name: "New", value: projects.projects.filter((p) => p.status === "new").length, color: "#0088FE" },
      { name: "Matching", value: projects.projects.filter((p) => p.status === "matching").length, color: "#00C49F" },
      { name: "Quoting", value: projects.projects.filter((p) => p.status === "quoting").length, color: "#FFBB28" },
      { name: "Complete", value: completedProjects, color: "#FF8042" },
    ]

    const revenueByMonth = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      revenueByMonth.push({
        month: date.toLocaleDateString("en-US", { month: "short" }),
        revenue: Math.floor(Math.random() * 50000) + 20000,
        projects: Math.floor(Math.random() * 10) + 5,
      })
    }

    const clientProjectCounts = clients.clients
      .map((client) => ({
        name: client.name,
        projects: projects.projects.filter((p) => p.clientId === client.id).length,
        revenue: Math.floor(Math.random() * 100000) + 10000,
      }))
      .sort((a, b) => b.projects - a.projects)
      .slice(0, 5)

    const recentActivity = [
      {
        id: "1",
        type: "project" as const,
        title: "New project created",
        description: "Project 'Office Building Renovation' was created",
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        user: "System",
        status: "success" as const,
      },
      {
        id: "2",
        type: "matching" as const,
        title: "Price matching completed",
        description: "AI matching completed for 'Residential Complex' with 95% confidence",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        user: "System",
        status: "success" as const,
      },
    ]

    const systemHealth = {
      cpu: Math.floor(Math.random() * 30) + 20,
      memory: Math.floor(Math.random() * 40) + 30,
      database: Math.floor(Math.random() * 20) + 10,
      api: Math.floor(Math.random() * 100) + 50,
    }

    const dashboardData = {
      totalProjects,
      activeProjects,
      completedProjects,
      totalClients,
      totalRevenue: Math.floor(totalRevenue),
      avgProjectValue: Math.floor(avgProjectValue),
      projectsByStatus,
      revenueByMonth,
      topClients: clientProjectCounts,
      recentActivity,
      systemHealth,
    }

    return NextResponse.json(dashboardData)
  } catch (error) {
    console.error("❌ Dashboard API error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
