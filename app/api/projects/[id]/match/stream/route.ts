import type { NextRequest } from "next/server"
import { getApiSettings } from "@/app/api/admin/settings/route"
import { CohereMatcher } from "@/lib/cohere-matcher"
import { ExcelParser } from "@/lib/excel-parser"
import { MongoDBService } from "@/lib/mongodb-service"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const projectId = params.id

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()

      const sendEvent = (event: string, data: object | string) => {
        const message = typeof data === "string" ? data : JSON.stringify(data)
        controller.enqueue(encoder.encode(`event: ${event}\n`))
        controller.enqueue(encoder.encode(`data: ${message}\n\n`))
      }

      const sendMessage = (data: string) => {
        controller.enqueue(encoder.encode(`data: ${data}\n\n`))
      }

      try {
        const formData = await req.formData()
        const file = formData.get("file") as File | null
        const clientName = formData.get("clientName") as string
        const projectName = formData.get("projectName") as string

        if (!file) {
          sendEvent("error", { message: "No file uploaded" })
          controller.close()
          return
        }

        // Get API settings
        const settings = getApiSettings()
        if (!settings.cohereApiKey) {
          sendEvent("error", { message: "Cohere API key not configured" })
          controller.close()
          return
        }

        sendMessage("Initializing Cohere client...")

        // Parse the uploaded file
        sendMessage("Parsing BoQ file...")
        const parsedData = await ExcelParser.parseBoQFile(file)

        if (!parsedData.length) {
          sendEvent("error", { message: "No valid BoQ data found in file" })
          controller.close()
          return
        }

        // Extract inquiry items
        const inquiryItems = parsedData.flatMap((sheet) =>
          sheet.items.filter((item) => !ExcelParser.isNonItem(item.description)).map((item) => item.description),
        )

        sendMessage(`Extracted ${inquiryItems.length} line items from inquiry.`)

        if (!inquiryItems.length) {
          sendEvent("error", { message: "No inquiry items found to match" })
          controller.close()
          return
        }

        // Load price list from database
        sendMessage("Loading price list from database...")
        const { descriptions, rates, items } = await MongoDBService.loadPriceList()
        const pricelistItems = items.map((item, index) => ({
          description: descriptions[index],
          rate: rates[index],
        }))

        sendMessage(`Found ${pricelistItems.length} items in price database.`)

        // Initialize Cohere matcher
        const matcher = new CohereMatcher(settings.cohereApiKey)

        // Perform matching with progress updates
        const results = await matcher.matchItems(inquiryItems, pricelistItems, (progress, message) => {
          sendMessage(message)
        })

        // Send results one by one
        const matchedItems = inquiryItems.map((inquiry, index) => ({
          boqDescription: inquiry,
          boqUnit: "m3", // Would come from parsed data
          boqQty: 100, // Would come from parsed data
          matchedItemDescription: results[index].bestMatch,
          matchedRate: results[index].bestRate,
          confidence: results[index].confidence / 100,
        }))

        for (const item of matchedItems) {
          sendEvent("result", item)
          // Small delay to simulate real-time processing
          await new Promise((resolve) => setTimeout(resolve, 500))
        }

        const averageConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length / 100

        // Save job to database
        await MongoDBService.saveMatchingJob({
          projectId,
          model: "cohere",
          status: "completed",
          progress: 100,
          logs: ["Matching completed successfully"],
          results: matchedItems,
        })

        sendEvent("done", {
          message: "Cohere matching completed successfully",
          totalItems: matchedItems.length,
          averageConfidence: Math.round(averageConfidence * 100) / 100,
        })
      } catch (error) {
        console.error("Streaming matching error:", error)

        await MongoDBService.saveMatchingJob({
          projectId,
          model: "cohere",
          status: "failed",
          progress: 0,
          logs: [`Error: ${error}`],
          error: error instanceof Error ? error.message : "Unknown error",
        })

        sendEvent("error", {
          message: error instanceof Error ? error.message : "Internal server error",
        })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
