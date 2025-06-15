import { NextResponse } from "next/server"
import { PerformanceAnalytics } from "@/lib/performance-analytics"

export async function GET() {
  try {
    const analytics = PerformanceAnalytics.getInstance()
    const data = analytics.exportAnalytics()

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching performance analytics:", error)
    return NextResponse.json({ message: "Failed to fetch performance analytics" }, { status: 500 })
  }
}
