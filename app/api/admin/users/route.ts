import { NextResponse } from "next/server"
import { MongoDBService } from "@/lib/mongodb-service"

// GET /api/admin/users - Get all users (NO AUTH)
export async function GET() {
  console.log("👥 === GET USERS (NO AUTH) ===")

  try {
    const users = await MongoDBService.getAllUsers()
    console.log("📊 Retrieved users:", users.length)

    return NextResponse.json({
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        isVerified: u.isVerified,
        createdAt: u.createdAt,
        lastLogin: u.lastLogin,
      })),
    })
  } catch (error) {
    console.error("❌ Error fetching users:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
