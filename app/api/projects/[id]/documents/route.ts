import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

// Mock data store - same reference as in route.ts
const mockProjects: any[] = []

function getCurrentUser() {
  const tokenCookie = cookies().get("auth-token")
  if (!tokenCookie) return null
  try {
    return JSON.parse(tokenCookie.value)
  } catch {
    return null
  }
}

// POST /api/projects/[id]/documents - Upload a document to a project
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = getCurrentUser()
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  try {
    const projectIndex = mockProjects.findIndex((p) => p.id === params.id)
    if (projectIndex === -1) {
      return NextResponse.json({ message: "Project not found" }, { status: 404 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const documentType = formData.get("type") as string

    if (!file) {
      return NextResponse.json({ message: "No file uploaded" }, { status: 400 })
    }

    // In a real application, you would:
    // 1. Upload the file to S3 or another storage service
    // 2. Get the file URL
    // 3. Store the document metadata in the database

    // For now, we'll simulate this
    const document = {
      id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      type: documentType || "general",
      size: file.size,
      url: `/uploads/${file.name}`, // Mock URL
      uploadedAt: new Date(),
      uploadedBy: user.id,
    }

    // Add document to project
    if (!mockProjects[projectIndex].documents) {
      mockProjects[projectIndex].documents = []
    }
    mockProjects[projectIndex].documents.push(document)
    mockProjects[projectIndex].updatedAt = new Date()

    // If it's a BoQ file, update the project's boqFileUrl
    if (documentType === "boq") {
      mockProjects[projectIndex].boqFileUrl = document.url
    }

    return NextResponse.json({
      message: "Document uploaded successfully",
      document,
      project: mockProjects[projectIndex],
    })
  } catch (error) {
    console.error("Error uploading document:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/projects/[id]/documents/[documentId] - Delete a document
export async function DELETE(req: NextRequest, { params }: { params: { id: string; documentId: string } }) {
  const user = getCurrentUser()
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  try {
    const projectIndex = mockProjects.findIndex((p) => p.id === params.id)
    if (projectIndex === -1) {
      return NextResponse.json({ message: "Project not found" }, { status: 404 })
    }

    const project = mockProjects[projectIndex]
    if (!project.documents) {
      return NextResponse.json({ message: "Document not found" }, { status: 404 })
    }

    const documentIndex = project.documents.findIndex((d: any) => d.id === params.documentId)
    if (documentIndex === -1) {
      return NextResponse.json({ message: "Document not found" }, { status: 404 })
    }

    // Remove document from project
    project.documents.splice(documentIndex, 1)
    project.updatedAt = new Date()

    return NextResponse.json({ message: "Document deleted successfully" })
  } catch (error) {
    console.error("Error deleting document:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
