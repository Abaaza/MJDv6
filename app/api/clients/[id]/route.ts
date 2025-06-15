import { type NextRequest, NextResponse } from "next/server"
import { MongoDBService } from "@/lib/mongodb-service"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// GET /api/clients/[id] - Fetch a specific client (NO AUTH)
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  console.log("👥 GET Client (NO AUTH):", params.id)

  try {
    const clients = await MongoDBService.getClients({ limit: 1000 })
    const client = clients.clients.find((c) => c.id === params.id)

    if (!client) {
      return NextResponse.json({ message: "Client not found" }, { status: 404 })
    }

    return NextResponse.json({ client })
  } catch (error) {
    console.error("❌ Error getting client:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/clients/[id] - Update a specific client (NO AUTH)
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  console.log("👥 PUT Client (NO AUTH):", params.id)

  try {
    const updateData = await req.json()
    const updatedClient = await MongoDBService.updateClient(params.id, updateData)

    if (!updatedClient) {
      return NextResponse.json({ message: "Client not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Client updated successfully", client: updatedClient })
  } catch (error) {
    console.error("❌ Error updating client:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/clients/[id] - Delete a specific client (NO AUTH)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  console.log("👥 DELETE Client (NO AUTH):", params.id)

  try {
    const deleted = await MongoDBService.deleteClient(params.id)

    if (!deleted) {
      return NextResponse.json({ message: "Client not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Client deleted successfully" })
  } catch (error) {
    console.error("❌ Error deleting client:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
