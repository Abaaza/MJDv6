import { type NextRequest, NextResponse } from "next/server"
import { MongoDBService } from "@/lib/mongodb-service"
import { CohereMatcher } from "@/lib/cohere-matcher"
import { OpenAIMatcher } from "@/lib/openai-matcher"
import { HybridMatcher } from "@/lib/hybrid-matcher"
import { ExcelParser } from "@/lib/excel-parser"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const startTime = Date.now()
  console.log("🎯 === PRICE MATCHING API (NO AUTH) ===")

  try {
    const projectId = params.id
    const formData = await request.formData()

    const clientName = formData.get("clientName") as string
    const projectName = formData.get("projectName") as string
    const file = formData.get("file") as File
    const version = formData.get("version") as string

    console.log("📋 Form data:", { clientName, projectName, fileName: file?.name, version })

    if (!clientName || !projectName || !file) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
      "application/csv",
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 })
    }

    const settings = await MongoDBService.getApiSettings()

    if (version === "v1" && !settings.openaiApiKey) {
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 400 })
    }
    if ((version === "v0" || version === "v2") && !settings.cohereApiKey) {
      return NextResponse.json({ error: "Cohere API key not configured" }, { status: 400 })
    }

    let parsedData
    try {
      parsedData = await ExcelParser.parseBoQFile(file)
    } catch (parseError) {
      return NextResponse.json({ error: "Failed to parse file" }, { status: 400 })
    }

    const inquiryDescriptions = parsedData.flatMap((sheet) => sheet.items.map((item) => item.description))

    if (inquiryDescriptions.length === 0) {
      return NextResponse.json({ error: "No valid inquiry items found" }, { status: 400 })
    }

    const {
      descriptions: pricelistDescriptions,
      rates: pricelistRates,
      items: pricelistItems,
    } = await MongoDBService.loadPriceList()

    if (pricelistDescriptions.length === 0) {
      return NextResponse.json({ error: "No price list data found" }, { status: 500 })
    }

    let matcher: CohereMatcher | OpenAIMatcher | HybridMatcher
    let results: any[]

    try {
      switch (version) {
        case "v0":
          matcher = new CohereMatcher(settings.cohereApiKey!)
          const pricelistItemsForCohere = pricelistItems.map((item, index) => ({
            description: pricelistDescriptions[index],
            rate: pricelistRates[index],
          }))
          results = await matcher.matchItems(inquiryDescriptions, pricelistItemsForCohere)
          break

        case "v1":
          matcher = new OpenAIMatcher(settings.openaiApiKey!)
          results = await matcher.matchItems(inquiryDescriptions, pricelistDescriptions, pricelistRates)
          break

        case "v2":
          matcher = new HybridMatcher(settings.cohereApiKey!, settings.openaiApiKey!)
          results = await matcher.matchItems(inquiryDescriptions, pricelistDescriptions, pricelistRates)
          break

        default:
          return NextResponse.json({ error: "Invalid version specified" }, { status: 400 })
      }
    } catch (matchingError) {
      return NextResponse.json({ error: `Matching failed: ${matchingError}` }, { status: 500 })
    }

    const formattedResults = results.map((result, index) => {
      const originalItem = parsedData[0]?.items[index]
      return {
        originalDescription: inquiryDescriptions[index],
        matchedDescription: result.description || result.bestMatch,
        rate: result.rate || result.bestRate,
        confidence: result.confidence,
        quantity: originalItem?.quantity || 1,
        unit: originalItem?.unit || "nr",
        total: (originalItem?.quantity || 1) * (result.rate || result.bestRate),
        rowIndex: originalItem?.rowIndex,
        sheetName: originalItem?.sheetName,
      }
    })

    const averageConfidence = results.reduce((sum, r) => sum + (r.confidence || 0), 0) / results.length

    try {
      await MongoDBService.saveMatchingJob({
        projectId,
        model: version,
        status: "completed",
        progress: 100,
        logs: ["Matching completed successfully"],
        results: formattedResults,
        fileInfo: {
          name: file.name,
          size: file.size,
          type: file.type,
        },
      })
    } catch (saveError) {
      console.error("⚠️ Failed to save matching job:", saveError)
    }

    console.log("✅ Price matching completed")

    return NextResponse.json({
      success: true,
      results: formattedResults,
      summary: {
        totalItems: inquiryDescriptions.length,
        averageConfidence: Math.round(averageConfidence * 100) / 100,
        model: version,
        clientName,
        projectName,
        processingTime: Date.now(),
      },
    })
  } catch (error) {
    console.error("❌ Unexpected error:", error)
    return NextResponse.json({ error: `Matching failed: ${error}` }, { status: 500 })
  }
}
