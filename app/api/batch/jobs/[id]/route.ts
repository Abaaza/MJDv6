import { type NextRequest, NextResponse } from "next/server"
import { BatchProcessor } from "@/lib/batch-processor"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const batchProcessor = BatchProcessor.getInstance()
    const job = batchProcessor.getJob(params.id)

    if (!job) {
      return NextResponse.json({ message: "Job not found" }, { status: 404 })
    }

    return NextResponse.json({ job })
  } catch (error) {
    console.error("Error fetching batch job:", error)
    return NextResponse.json({ message: "Failed to fetch batch job" }, { status: 500 })
  }
}
