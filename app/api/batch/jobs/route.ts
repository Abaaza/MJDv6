import { NextResponse } from "next/server"
import { BatchProcessor } from "@/lib/batch-processor"

export async function GET() {
  try {
    const batchProcessor = BatchProcessor.getInstance()
    const jobs = batchProcessor.getAllJobs()

    return NextResponse.json({ jobs })
  } catch (error) {
    console.error("Error fetching batch jobs:", error)
    return NextResponse.json({ message: "Failed to fetch batch jobs" }, { status: 500 })
  }
}
