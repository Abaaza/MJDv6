import { NextResponse } from "next/server"
import { HealthMonitor } from "@/lib/health-monitor"

export async function GET() {
  try {
    const healthMonitor = HealthMonitor.getInstance()
    const healthData = healthMonitor.exportHealthData()

    return NextResponse.json(healthData, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="system-health-${new Date().toISOString().split("T")[0]}.json"`,
      },
    })
  } catch (error) {
    console.error("Error exporting health data:", error)
    return NextResponse.json({ message: "Failed to export health data" }, { status: 500 })
  }
}
