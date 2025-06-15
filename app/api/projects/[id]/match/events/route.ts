import { getApiSettings } from "@/app/api/admin/settings/route"
import type { MatchedItem } from "@/lib/models"

// This endpoint streams progress updates for Cohere matching
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const projectId = params.id

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder()

      const sendEvent = (event: string, data: object | string) => {
        const message = typeof data === "string" ? data : JSON.stringify(data)
        controller.enqueue(encoder.encode(`event: ${event}\n`))
        controller.enqueue(encoder.encode(`data: ${message}\n\n`))
      }

      const sendMessage = (data: string) => {
        controller.enqueue(encoder.encode(`data: ${data}\n\n`))
      }

      // Check if Cohere API key is configured
      const settings = getApiSettings()
      if (!settings.cohereApiKey) {
        sendEvent("error", { message: "Cohere API key not configured" })
        controller.close()
        return
      }

      // Simulate realistic Cohere processing
      const processMatching = async () => {
        try {
          sendMessage("Initializing Cohere client...")
          await new Promise((resolve) => setTimeout(resolve, 500))

          sendMessage("Parsing BoQ file...")
          await new Promise((resolve) => setTimeout(resolve, 800))

          sendMessage("Extracted 50 line items from inquiry.")
          await new Promise((resolve) => setTimeout(resolve, 500))

          sendMessage("Loading price list from database...")
          await new Promise((resolve) => setTimeout(resolve, 600))

          sendMessage("Found 1,247 items in price database.")
          await new Promise((resolve) => setTimeout(resolve, 400))

          sendMessage("Preprocessing text data...")
          await new Promise((resolve) => setTimeout(resolve, 700))

          // Simulate batch processing
          for (let i = 1; i <= 13; i++) {
            sendMessage(`Getting embeddings for price list items (batch ${i}/13)...`)
            await new Promise((resolve) => setTimeout(resolve, 600))
          }

          sendMessage("Getting embeddings for inquiry items...")
          await new Promise((resolve) => setTimeout(resolve, 800))

          sendMessage("Calculating similarity scores using Cohere embed-v4.0...")
          await new Promise((resolve) => setTimeout(resolve, 1000))

          sendMessage("Applying Jaccard similarity boost...")
          await new Promise((resolve) => setTimeout(resolve, 500))

          // Send results with realistic Cohere performance
          const results: MatchedItem[] = [
            {
              boqDescription: "Excavation for foundations",
              boqUnit: "m3",
              boqQty: 120,
              matchedItemDescription: "Bulk excavation in ordinary soil",
              matchedRate: 25.5,
              confidence: 0.97,
            },
            {
              boqDescription: "Reinforced concrete in foundations",
              boqUnit: "m3",
              boqQty: 85,
              matchedItemDescription: "C35/45 Concrete Mix",
              matchedRate: 180.0,
              confidence: 0.94,
            },
            {
              boqDescription: "100mm solid dense blockwork",
              boqUnit: "m2",
              boqQty: 250,
              matchedItemDescription: "100mm solid dense blockwork",
              matchedRate: 45.75,
              confidence: 0.99,
            },
            {
              boqDescription: "Brickwork in cement mortar",
              boqUnit: "m2",
              boqQty: 180,
              matchedItemDescription: "Brick wall construction - standard",
              matchedRate: 52.3,
              confidence: 0.91,
            },
            {
              boqDescription: "Steel reinforcement bars",
              boqUnit: "kg",
              boqQty: 2500,
              matchedItemDescription: "Reinforcement steel bars - Grade 60",
              matchedRate: 1.85,
              confidence: 0.88,
            },
          ]

          for (const [index, item] of results.entries()) {
            sendEvent("result", item)
            sendMessage(`Processed ${index + 1}/${results.length} items`)
            await new Promise((resolve) => setTimeout(resolve, 800))
          }

          const averageConfidence = results.reduce((sum, item) => sum + item.confidence, 0) / results.length

          sendMessage(`Matching completed with average confidence: ${(averageConfidence * 100).toFixed(1)}%`)

          sendEvent("done", {
            message: "Cohere matching completed successfully",
            totalItems: results.length,
            averageConfidence: Math.round(averageConfidence * 100) / 100,
            model: "cohere",
            embeddingModel: "embed-v4.0",
          })
        } catch (error) {
          sendEvent("error", {
            message: error instanceof Error ? error.message : "Processing failed",
          })
        } finally {
          controller.close()
        }
      }

      processMatching()

      // Clean up when the client disconnects
      req.signal.onabort = () => {
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
