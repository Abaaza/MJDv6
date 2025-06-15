import { type NextRequest, NextResponse } from "next/server"
import { MongoDBService } from "@/lib/mongodb-service"

// GET /api/matching/jobs/[id]/download - Download matching results
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const job = await MongoDBService.getMatchingJob(params.id)

    if (!job) {
      return NextResponse.json({ message: "Job not found" }, { status: 404 })
    }

    if (job.status !== "completed" || !job.results) {
      return NextResponse.json({ message: "Job not completed or no results available" }, { status: 400 })
    }

    // For now, return a simple CSV format
    // In production, you'd recreate the Excel file with filled rates
    const csvContent = [
      "BoQ Description,Unit,Quantity,Matched Description,Rate,Confidence",
      ...job.results.map(
        (item: any) =>
          `"${item.boqDescription}","${item.boqUnit || ""}","${item.boqQty || ""}","${item.matchedItemDescription}","${item.matchedRate}","${(item.confidence * 100).toFixed(1)}%"`,
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })

    return new Response(blob, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="matching-results-${params.id}.csv"`,
      },
    })
  } catch (error) {
    console.error("Error downloading matching results:", error)
    return NextResponse.json({ message: "Failed to download matching results" }, { status: 500 })
  }
}
