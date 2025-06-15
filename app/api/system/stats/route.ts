import { NextResponse } from "next/server"
import { UserManagementService } from "@/lib/user-management"
import { BatchProcessor } from "@/lib/batch-processor"

export async function GET() {
  try {
    const userService = UserManagementService.getInstance()
    const batchProcessor = BatchProcessor.getInstance()

    const allUsers = userService.getAllUserProfiles()
    const activeUsers = userService.getActiveUsers(30)
    const allJobs = batchProcessor.getAllJobs()
    const completedJobs = allJobs.filter((job) => job.status === "completed")

    // Simulate API call stats
    const totalApiCalls = Math.floor(Math.random() * 100000) + 50000
    const errorRate = Math.random() * 5

    const stats = {
      totalUsers: allUsers.length,
      activeUsers: activeUsers.length,
      totalJobs: allJobs.length,
      completedJobs: completedJobs.length,
      totalApiCalls,
      errorRate,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching system stats:", error)
    return NextResponse.json({ message: "Failed to fetch system stats" }, { status: 500 })
  }
}
