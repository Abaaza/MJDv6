import { type NextRequest, NextResponse } from "next/server"
import { MongoDBService } from "@/lib/mongodb-service"

// GET /api/matching/jobs/[id] - Get specific matching job
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const job = await MongoDBService.getMatchingJob(params.id)

    if (!job) {
      return NextResponse.json({ message: "Job not found" }, { status: 404 })
    }

    return NextResponse.json({ job })
  } catch (error) {
    console.error("Error fetching matching job:", error)
    return NextResponse.json({ message: "Failed to fetch matching job" }, { status: 500 })
  }
}
