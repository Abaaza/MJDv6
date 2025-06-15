import { type NextRequest, NextResponse } from "next/server"
import { MongoDBService } from "@/lib/mongodb-service"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  console.log("🧪 TEST ENDPOINT - No auth required")

  try {
    // Skip all authentication - just test database connection
    await MongoDBService.connect()

    const result = await MongoDBService.getPriceItems({
      page: 1,
      limit: 5, // Just get 5 items for testing
      sortBy: "createdAt",
      sortOrder: "desc",
    })

    console.log("✅ TEST ENDPOINT - Got items:", result.items.length)

    return NextResponse.json({
      success: true,
      message: "Database connection working",
      itemCount: result.total,
      sampleItems: result.items.slice(0, 3).map((item) => ({
        id: item.id,
        code: item.code,
        description: item.description?.substring(0, 100),
        category: item.category,
      })),
    })
  } catch (error) {
    console.error("❌ TEST ENDPOINT - Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}
