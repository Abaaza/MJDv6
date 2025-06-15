import { type NextRequest, NextResponse } from "next/server"
import { MongoDBService } from "@/lib/mongodb-service"

// GET /api/admin/system-settings - Get system settings (NO AUTH)
export async function GET() {
  console.log("⚙️ GET System Settings (NO AUTH)")

  try {
    await MongoDBService.connect()
    const settings = await MongoDBService.getSystemSettings()
    return NextResponse.json(settings)
  } catch (error) {
    console.error("❌ Error fetching system settings:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

// POST /api/admin/system-settings - Update system settings (NO AUTH)
export async function POST(req: NextRequest) {
  console.log("⚙️ POST System Settings (NO AUTH)")

  try {
    const settings = await req.json()
    await MongoDBService.connect()
    await MongoDBService.updateSystemSettings(settings)

    return NextResponse.json({ message: "System settings updated successfully" })
  } catch (error) {
    console.error("❌ Error updating system settings:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
