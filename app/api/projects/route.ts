import { type NextRequest, NextResponse } from "next/server"
import { MongoDBService } from "@/lib/mongodb-service"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// GET /api/projects - Fetch all projects (NO AUTH, WITH FALLBACK)
export async function GET(req: NextRequest) {
  console.log("🏗️ GET Projects (NO AUTH)")

  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || ""
    const clientId = searchParams.get("clientId") || ""
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const sortBy = searchParams.get("sortBy") || "createdAt"
    const sortOrder = searchParams.get("sortOrder") || "desc"

    console.log("🔍 Query parameters:", { search, status, clientId, page, limit })

    // Try to get projects from database
    try {
      const result = await MongoDBService.getProjects({
        search,
        status,
        clientId,
        page,
        limit,
        sortBy,
        sortOrder,
      })
      console.log("✅ Projects fetched from DB:", result.projects.length)
      return NextResponse.json(result)
    } catch (dbError) {
      console.error("❌ Database error, returning fallback data:", dbError)

      // Return fallback data if database fails
      const fallbackResult = {
        projects: [
          {
            id: "1",
            name: "Office Building Renovation",
            clientId: "1",
            clientName: "ABC Construction",
            status: "active",
            description: "Complete renovation of 5-story office building",
            createdAt: new Date().toISOString(),
            documents: [],
          },
          {
            id: "2",
            name: "Residential Complex",
            clientId: "2",
            clientName: "XYZ Builders",
            status: "pending",
            description: "New residential complex with 50 units",
            createdAt: new Date().toISOString(),
            documents: [],
          },
        ],
        total: 2,
        page: 1,
        totalPages: 1,
      }

      return NextResponse.json(fallbackResult)
    }
  } catch (error) {
    console.error("❌ Complete API failure:", error)

    // Return minimal fallback even if everything fails
    return NextResponse.json({
      projects: [],
      total: 0,
      page: 1,
      totalPages: 0,
      error: "Database connection failed",
    })
  }
}

// POST /api/projects - Create a new project (NO AUTH)
export async function POST(req: NextRequest) {
  console.log("🏗️ POST Projects (NO AUTH)")

  try {
    const projectData = await req.json()
    const { name, clientId, clientName, status, description } = projectData

    if (!name || !clientId || !clientName) {
      return NextResponse.json({ message: "Name, client ID, and client name are required" }, { status: 400 })
    }

    try {
      const newProject = await MongoDBService.createProject({
        name,
        clientId,
        clientName,
        status: status || "new",
        description,
        documents: [],
        createdBy: "system",
      })

      console.log("✅ Project created:", newProject.id)
      return NextResponse.json({ message: "Project created successfully", project: newProject }, { status: 201 })
    } catch (dbError) {
      console.error("❌ Database error creating project:", dbError)
      return NextResponse.json({ message: "Database error - project not created" }, { status: 500 })
    }
  } catch (error) {
    console.error("❌ Error creating project:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
