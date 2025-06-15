import { type NextRequest, NextResponse } from "next/server"

// Force dynamic rendering
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const reportType = url.searchParams.get("type") || "overview"
    const from = url.searchParams.get("from")
    const to = url.searchParams.get("to")

    // Mock report data - in production, this would query your database
    const mockReportData = {
      projectsByMonth: [
        { month: "Jan", count: 12, value: 150000 },
        { month: "Feb", count: 15, value: 180000 },
        { month: "Mar", count: 18, value: 220000 },
        { month: "Apr", count: 14, value: 175000 },
        { month: "May", count: 20, value: 250000 },
        { month: "Jun", count: 16, value: 200000 },
      ],
      clientDistribution: [
        { name: "Acme Corp", value: 35, color: "#0088FE" },
        { name: "BuildCo", value: 25, color: "#00C49F" },
        { name: "ConstructLtd", value: 20, color: "#FFBB28" },
        { name: "Others", value: 20, color: "#FF8042" },
      ],
      priceMatchingAccuracy: [
        { date: "2024-01", accuracy: 85, volume: 120 },
        { date: "2024-02", accuracy: 87, volume: 135 },
        { date: "2024-03", accuracy: 89, volume: 150 },
        { date: "2024-04", accuracy: 91, volume: 140 },
        { date: "2024-05", accuracy: 93, volume: 165 },
        { date: "2024-06", accuracy: 95, volume: 180 },
      ],
      revenueByCategory: [
        { category: "Residential", revenue: 450000, projects: 25 },
        { category: "Commercial", revenue: 680000, projects: 18 },
        { category: "Industrial", revenue: 320000, projects: 12 },
        { category: "Infrastructure", revenue: 550000, projects: 15 },
      ],
      performanceMetrics: {
        totalProjects: 70,
        totalRevenue: 2000000,
        averageProjectValue: 28571,
        matchingAccuracy: 93,
        clientSatisfaction: 4.8,
        completionRate: 96,
      },
    }

    return NextResponse.json(mockReportData)
  } catch (error) {
    console.error("Error generating report:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
