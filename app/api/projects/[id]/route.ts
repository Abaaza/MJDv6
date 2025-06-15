import { type NextRequest, NextResponse } from "next/server"
import { MongoDBService } from "@/lib/mongodb-service"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// GET /api/projects/[id] - Fetch a specific project (NO AUTH)
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  console.log("🏗️ GET Project (NO AUTH):", params.id)

  try {
    const project = await MongoDBService.getProject(params.id)

    if (!project) {
      return NextResponse.json({ message: "Project not found" }, { status: 404 })
    }

    return NextResponse.json({ project })
  } catch (error) {
    console.error("❌ Error getting project:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/projects/[id] - Update a specific project (NO AUTH)
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  console.log("🏗️ PUT Project (NO AUTH):", params.id)

  try {
    const updateData = await req.json()
    const updatedProject = await MongoDBService.updateProject(params.id, updateData)

    if (!updatedProject) {
      return NextResponse.json({ message: "Project not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Project updated successfully", project: updatedProject })
  } catch (error) {
    console.error("❌ Error updating project:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/projects/[id] - Delete a specific project (NO AUTH)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  console.log("🏗️ DELETE Project (NO AUTH):", params.id)

  try {
    const deleted = await MongoDBService.deleteProject(params.id)

    if (!deleted) {
      return NextResponse.json({ message: "Project not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Project deleted successfully" })
  } catch (error) {
    console.error("❌ Error deleting project:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
