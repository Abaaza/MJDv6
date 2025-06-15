import { type NextRequest, NextResponse } from "next/server"
import { BatchProcessor } from "@/lib/batch-processor"

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const files = formData.getAll("files") as File[]
    const model = formData.get("model") as "v0" | "v1" | "v2"
    const clientName = formData.get("clientName") as string
    const projectName = formData.get("projectName") as string

    if (!files.length || !model || !clientName || !projectName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const batchProcessor = BatchProcessor.getInstance()
    const jobId = await batchProcessor.createBatchJob(files, model, clientName, projectName)

    return NextResponse.json({ jobId, message: "Batch processing started" })
  } catch (error) {
    console.error("Batch processing error:", error)
    return NextResponse.json(
      { error: `Failed to start batch processing: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 },
    )
  }
}
