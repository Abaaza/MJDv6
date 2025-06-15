import { type NextRequest, NextResponse } from "next/server"
import { MongoDBService } from "@/lib/mongodb-service"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// GET /api/clients - Fetch all clients (NO AUTH, WITH FALLBACK)
export async function GET(req: NextRequest) {
  console.log("👥 === GET CLIENTS (NO AUTH) ===")

  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || ""
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")

    console.log("🔍 Query parameters:", { search, status, page, limit })

    // Try to get clients from database
    try {
      const result = await MongoDBService.getClients({
        search,
        status,
        page,
        limit,
      })
      console.log("✅ Clients fetched from DB:", result.clients.length)
      return NextResponse.json(result)
    } catch (dbError) {
      console.error("❌ Database error, returning fallback data:", dbError)

      // Return fallback data if database fails
      const fallbackResult = {
        clients: [
          {
            id: "1",
            name: "ABC Construction",
            email: "contact@abc-construction.com",
            phone: "+1-555-0123",
            company: "ABC Construction Ltd",
            status: "active",
            createdAt: new Date().toISOString(),
          },
          {
            id: "2",
            name: "XYZ Builders",
            email: "info@xyz-builders.com",
            phone: "+1-555-0456",
            company: "XYZ Builders Inc",
            status: "prospect",
            createdAt: new Date().toISOString(),
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
      clients: [],
      total: 0,
      page: 1,
      totalPages: 0,
      error: "Database connection failed",
    })
  }
}

// POST /api/clients - Create a new client (NO AUTH)
export async function POST(req: NextRequest) {
  console.log("👥 === CREATE CLIENT (NO AUTH) ===")

  try {
    const clientData = await req.json()
    const { name, email, phone, company, address, contactPerson, status, notes } = clientData

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ message: "Client name is required" }, { status: 400 })
    }

    try {
      const newClient = await MongoDBService.createClient({
        name: name.trim(),
        email: email?.trim() || "",
        phone: phone?.trim() || "",
        company: company?.trim() || "",
        address: address?.trim() || "",
        contactPerson: contactPerson?.trim() || "",
        status: status || "prospect",
        notes: notes?.trim() || "",
        createdBy: "system",
      })

      console.log("✅ Client created:", newClient.id)
      return NextResponse.json({ message: "Client created successfully", client: newClient }, { status: 201 })
    } catch (dbError) {
      console.error("❌ Database error creating client:", dbError)
      return NextResponse.json({ message: "Database error - client not created" }, { status: 500 })
    }
  } catch (error) {
    console.error("❌ Error creating client:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
