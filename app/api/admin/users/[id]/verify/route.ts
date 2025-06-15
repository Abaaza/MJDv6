import { type NextRequest, NextResponse } from "next/server"
import { MongoDBService } from "@/lib/mongodb-service"

// POST /api/admin/users/[id]/verify - Verify a user (NO AUTH)
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  console.log("✅ === VERIFY USER (NO AUTH) ===")

  try {
    const { action } = await req.json()
    await MongoDBService.connect()

    const success = await MongoDBService.updateUserVerification(params.id, action === "verify")

    if (success) {
      return NextResponse.json({
        message: `User ${action === "verify" ? "verified" : "unverified"} successfully`,
      })
    } else {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }
  } catch (error) {
    console.error("❌ Error updating user verification:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
