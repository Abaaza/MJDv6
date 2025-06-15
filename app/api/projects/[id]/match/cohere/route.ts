import { type NextRequest, NextResponse } from "next/server"
import { getApiSettings } from "@/app/api/admin/settings/route"
import { CohereMatcher } from "@/lib/cohere-matcher"
import { ExcelParser } from "@/lib/excel-parser"
import { MongoDBService } from "@/lib/mongodb-service"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const projectId = params.id

  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const clientName = formData.get("clientName") as string
    const projectName = formData.get("projectName") as string

    if (!file) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 })
    }

    // Get API settings
    const settings = getApiSettings()
    if (!settings.cohereApiKey) {
      return NextResponse.json({ error: "Cohere API key not configured." }, { status: 400 })
    }

    // Parse the uploaded file
    const parsedData = await ExcelParser.parseBoQFile(file)
    if (!parsedData.length) {
      return NextResponse.json({ error: "No valid BoQ data found in file." }, { status: 400 })
    }

    // Extract inquiry items
    const inquiryItems = parsedData.flatMap((sheet) =>
      sheet.items.filter((item) => !ExcelParser.isNonItem(item.description)).map((item) => item.description),
    )

    if (!inquiryItems.length) {
      return NextResponse.json({ error: "No inquiry items found to match." }, { status: 400 })
    }

    // Load price list from database
    const { descriptions, rates, items } = await MongoDBService.loadPriceList()
    const pricelistItems = items.map((item, index) => ({
      description: descriptions[index],
      rate: rates[index],
    }))

    // Initialize Cohere matcher
    const matcher = new CohereMatcher(settings.cohereApiKey)

    // Perform matching
    const results = await matcher.matchItems(inquiryItems, pricelistItems, (progress, message) => {
      console.log(`Progress: ${progress}% - ${message}`)
      // In production, you'd publish this to a pub/sub system
    })

    // Format results for response
    const matchedItems = inquiryItems.map((inquiry, index) => ({
      boqDescription: inquiry,
      boqUnit: "m3", // Would come from parsed data
      boqQty: 100, // Would come from parsed data
      matchedItemDescription: results[index].bestMatch,
      matchedRate: results[index].bestRate,
      confidence: results[index].confidence / 100,
    }))

    // Save job to database
    await MongoDBService.saveMatchingJob({
      projectId,
      model: "cohere",
      status: "completed",
      progress: 100,
      logs: ["Matching completed successfully"],
      results: matchedItems,
    })

    return NextResponse.json({
      message: "Cohere matching completed successfully",
      results: matchedItems,
      totalItems: matchedItems.length,
      averageConfidence: results.reduce((sum, r) => sum + r.confidence, 0) / results.length / 100,
    })
  } catch (error) {
    console.error("Cohere matching error:", error)

    await MongoDBService.saveMatchingJob({
      projectId,
      model: "cohere",
      status: "failed",
      progress: 0,
      logs: [`Error: ${error}`],
      error: error instanceof Error ? error.message : "Unknown error",
    })

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
