import { NextResponse } from "next/server"
import { MongoDBService } from "@/lib/mongodb-service"

// GET /api/matching/jobs - Get all matching jobs
export async function GET() {
  try {
    const jobs = await MongoDBService.getMatchingJobs()
    return NextResponse.json({ jobs })
  } catch (error) {
    console.error("Error fetching matching jobs:", error)
    return NextResponse.json({ message: "Failed to fetch matching jobs" }, { status: 500 })
  }
}
