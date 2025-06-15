import { type NextRequest, NextResponse } from "next/server"

// GET /api/projects/[id]/match/status - Get matching job status
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const projectId = params.id

  try {
    // In production, query MongoDB for job status
    // For now, return mock status
    const mockStatus = {
      id: `job-${projectId}`,
      projectId,
      status: "completed",
      model: "cohere",
      progress: 100,
      logs: [
        "Initializing Cohere client...",
        "Parsing BoQ file...",
        "Extracted 50 line items from inquiry.",
        "Loading price list from database...",
        "Found 1,247 items in price database.",
        "Matching completed with average confidence: 93.8%",
      ],
      results: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    return NextResponse.json({ job: mockStatus })
  } catch (error) {
    console.error("Error fetching job status:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
