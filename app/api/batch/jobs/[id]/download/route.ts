import { type NextRequest, NextResponse } from "next/server"
import { BatchProcessor } from "@/lib/batch-processor"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const batchProcessor = BatchProcessor.getInstance()
    const blob = await batchProcessor.exportBatchResults(params.id)

    return new Response(blob, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="batch-results-${params.id}.xlsx"`,
      },
    })
  } catch (error) {
    console.error("Error downloading batch results:", error)
    return NextResponse.json({ message: "Failed to download batch results" }, { status: 500 })
  }
}
