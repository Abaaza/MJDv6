import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Mock system statistics - in production, this would query your database and system metrics
    const stats = {
      totalUsers: 24,
      activeProjects: 15,
      storageUsed: 12.5,
      apiCalls: 15420,
      uptime: "99.9%",
      memoryUsage: 65,
      cpuUsage: 23,
      diskUsage: 45,
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error("Error fetching system stats:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
