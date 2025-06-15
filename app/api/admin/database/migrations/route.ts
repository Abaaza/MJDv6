import { NextResponse } from "next/server"
import { databaseMigrations } from "@/lib/database-migrations"

export async function GET() {
  try {
    const status = await databaseMigrations.getMigrationStatus()
    return NextResponse.json({
      success: true,
      data: status,
    })
  } catch (error) {
    console.error("Error getting migration status:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to get migration status",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST() {
  try {
    const result = await databaseMigrations.runMigrations()
    return NextResponse.json(result)
  } catch (error) {
    console.error("Migration error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Migration failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
