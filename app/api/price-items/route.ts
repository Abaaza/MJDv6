import { type NextRequest, NextResponse } from "next/server"
import { MongoDBService } from "@/lib/mongodb-service"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  console.log("💰 GET /api/price-items - Starting request (NO AUTH)")

  try {
    // TEMPORARILY BYPASS AUTHENTICATION TO GET DATA LOADING
    console.log("⚠️ BYPASSING AUTHENTICATION FOR TESTING")

    // Get query parameters
    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search") || ""
    const category = searchParams.get("category") || ""
    const subCategory = searchParams.get("subCategory") || ""
    const minRate = searchParams.get("minRate")
    const maxRate = searchParams.get("maxRate")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const sortBy = searchParams.get("sortBy") || "createdAt"
    const sortOrder = searchParams.get("sortOrder") || "desc"

    console.log("🔍 Query parameters:", { search, category, page, limit, sortBy, sortOrder })

    // Connect to database
    console.log("🔌 Connecting to MongoDB...")
    await MongoDBService.connect()
    console.log("✅ MongoDB connected")

    // Get price items
    console.log("📊 Fetching price items...")
    const result = await MongoDBService.getPriceItems({
      search,
      category,
      subCategory,
      minRate: minRate ? Number.parseFloat(minRate) : undefined,
      maxRate: maxRate ? Number.parseFloat(maxRate) : undefined,
      page,
      limit,
      sortBy,
      sortOrder,
    })

    console.log("✅ Price items fetched successfully:", {
      count: result.items.length,
      total: result.total,
      page: result.page,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("❌ Error in price-items API:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

export async function POST(req: NextRequest) {
  console.log("💰 POST /api/price-items - Starting request (NO AUTH)")

  try {
    // TEMPORARILY BYPASS AUTHENTICATION
    console.log("⚠️ BYPASSING AUTHENTICATION FOR TESTING")

    const itemData = await req.json()
    const { code, ref, description, category, subCategory, unit, rate, keywords, phrases } = itemData

    if (!description) {
      return NextResponse.json({ message: "Description is required" }, { status: 400 })
    }

    await MongoDBService.connect()

    const newItem = await MongoDBService.createPriceItem({
      code: code?.toUpperCase(),
      ref,
      description,
      category,
      subCategory,
      unit,
      rate: rate ? Number.parseFloat(rate.toString()) : undefined,
      keywords: keywords || [],
      phrases: phrases || [],
    })

    console.log("✅ Price item created:", newItem.id)
    return NextResponse.json(
      {
        message: "Price item created successfully",
        item: newItem,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("❌ Error creating price item:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
