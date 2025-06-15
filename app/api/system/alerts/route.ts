import { NextResponse } from "next/server"
import { HealthMonitor } from "@/lib/health-monitor"

export async function GET() {
  try {
    const healthMonitor = HealthMonitor.getInstance()
    const alerts = healthMonitor.getActiveAlerts()

    return NextResponse.json({ alerts })
  } catch (error) {
    console.error("Error fetching system alerts:", error)
    return NextResponse.json({ message: "Failed to fetch system alerts" }, { status: 500 })
  }
}
