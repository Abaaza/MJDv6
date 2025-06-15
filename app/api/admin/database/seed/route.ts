import { type NextRequest, NextResponse } from "next/server"
import { databaseSeeder } from "@/lib/database-seeder"

export async function POST(req: NextRequest) {
  try {
    const { force = false } = await req.json()

    let result
    if (force) {
      result = await databaseSeeder.forceSeed()
    } else {
      result = await databaseSeeder.seedDatabase()
    }

    if (result.success) {
      await databaseSeeder.updateSeederMetadata()
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Database seeding error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Database seeding failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  try {
    const status = await databaseSeeder.getSeederStatus()
    return NextResponse.json({
      success: true,
      data: status,
    })
  } catch (error) {
    console.error("Error getting seeder status:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to get seeder status",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
