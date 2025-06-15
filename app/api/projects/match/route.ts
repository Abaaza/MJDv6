import { type NextRequest, NextResponse } from "next/server"
import { ExcelParser } from "@/lib/excel-parser"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  console.log("🎯 === PRICE MATCHING API START (NO AUTH) ===")
  console.log("⚠️ BYPASSING AUTHENTICATION FOR TESTING")

  try {
    console.log("📋 === PARSING FORM DATA ===")
    let formData
    try {
      formData = await request.formData()
      console.log("✅ Form data parsed successfully")
    } catch (formError) {
      console.error("❌ Failed to parse form data:", formError)
      return NextResponse.json({ error: "Invalid form data" }, { status: 400 })
    }

    const clientName = (formData.get("clientName") as string) || "Unknown Client"
    const projectName = (formData.get("projectName") as string) || "Unknown Project"
    const file = formData.get("file") as File
    const model = (formData.get("model") as string) || "v0"

    console.log("📊 Form data received:", {
      clientName,
      projectName,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      model,
      hasFile: !!file,
    })

    // Validate required fields
    if (!file) {
      console.log("❌ Validation failed: Missing file")
      return NextResponse.json({ error: "File is required" }, { status: 400 })
    }

    if (!clientName || clientName === "Unknown Client") {
      console.log("❌ Validation failed: Missing client name")
      return NextResponse.json({ error: "Client name is required" }, { status: 400 })
    }

    if (!projectName || projectName === "Unknown Project") {
      console.log("❌ Validation failed: Missing project name")
      return NextResponse.json({ error: "Project name is required" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
      "application/csv",
    ]

    if (!allowedTypes.includes(file.type)) {
      console.log("❌ Invalid file type:", file.type)
      return NextResponse.json({ error: `Invalid file type: ${file.type}` }, { status: 400 })
    }

    console.log("✅ File validation passed")

    // Parse the Excel file
    console.log("📄 === FILE PARSING START ===")
    let parsedData
    try {
      parsedData = await ExcelParser.parseBoQFile(file)
      console.log("📄 File parsing completed:", {
        sheetsCount: parsedData.length,
        totalItems: parsedData.reduce((sum, sheet) => sum + sheet.items.length, 0),
      })
    } catch (parseError) {
      console.error("❌ File parsing failed:", parseError)
      return NextResponse.json({ error: "Failed to parse file" }, { status: 400 })
    }

    const inquiryDescriptions = parsedData.flatMap((sheet) =>
      sheet.items
        .filter((item) => item.description && item.description.trim().length > 0)
        .map((item) => item.description.trim()),
    )

    console.log("📊 Extracted inquiry descriptions:", {
      totalCount: inquiryDescriptions.length,
    })

    if (inquiryDescriptions.length === 0) {
      console.log("❌ No valid inquiry items found")
      return NextResponse.json({ error: "No valid inquiry items found in the file" }, { status: 400 })
    }

    // Load price list from MongoDB
    console.log("💰 === LOADING PRICE LIST ===")
    let pricelistData
    try {
      const { MongoDBService } = await import("@/lib/mongodb-service")
      pricelistData = await MongoDBService.loadPriceList()
      console.log("✅ Price list loaded:", {
        itemsCount: pricelistData.items.length,
        descriptionsCount: pricelistData.descriptions.length,
      })
    } catch (pricelistError) {
      console.error("❌ Failed to load price list:", pricelistError)
      return NextResponse.json({ error: "Failed to load price list" }, { status: 500 })
    }

    if (pricelistData.descriptions.length === 0) {
      console.log("❌ No price list data found")
      return NextResponse.json({ error: "No price list data found in database" }, { status: 500 })
    }

    // For now, return a simple mock response until we fix the AI matching
    console.log("🤖 === MOCK MATCHING (AI DISABLED FOR TESTING) ===")
    const mockResults = inquiryDescriptions.map((description, index) => ({
      originalDescription: description,
      matchedDescription: "Mock matched item",
      rate: 100 + index,
      confidence: 0.8,
      quantity: 1,
      unit: "nr",
      total: 100 + index,
    }))

    const processingTime = Date.now() - startTime

    console.log("🎉 === PRICE MATCHING COMPLETE ===")
    console.log("📊 Final summary:", {
      success: true,
      totalItems: inquiryDescriptions.length,
      processingTimeMs: processingTime,
    })

    return NextResponse.json({
      success: true,
      results: mockResults,
      summary: {
        totalItems: inquiryDescriptions.length,
        averageConfidence: 0.8,
        model: model,
        clientName,
        projectName,
        processingTime,
      },
    })
  } catch (error) {
    console.error("❌ === UNEXPECTED ERROR ===")
    console.error("Error details:", error)

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
