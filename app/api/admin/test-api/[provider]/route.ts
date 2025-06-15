import { type NextRequest, NextResponse } from "next/server"
import { MongoDBService } from "@/lib/mongodb-service"

// POST /api/admin/test-api/[provider] - Test API connection (NO AUTH)
export async function POST(req: NextRequest, { params }: { params: { provider: string } }) {
  console.log("🧪 Testing API (NO AUTH):", params.provider)

  try {
    await MongoDBService.connect()
    const settings = await MongoDBService.getApiSettings()

    const { provider } = params
    let apiKey: string | undefined

    switch (provider) {
      case "cohere":
        apiKey = settings.cohereApiKey
        break
      case "openai":
        apiKey = settings.openaiApiKey
        break
      case "gemini":
        apiKey = settings.geminiApiKey
        break
      default:
        return NextResponse.json({ message: "Invalid provider" }, { status: 400 })
    }

    if (!apiKey) {
      return NextResponse.json({ message: `${provider} API key not configured` }, { status: 400 })
    }

    let testResult = false

    switch (provider) {
      case "cohere":
        try {
          const response = await fetch("https://api.cohere.ai/v1/models", {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
          })
          testResult = response.ok
        } catch {
          testResult = false
        }
        break

      case "openai":
        try {
          const response = await fetch("https://api.openai.com/v1/models", {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
          })
          testResult = response.ok
        } catch {
          testResult = false
        }
        break

      case "gemini":
        try {
          const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`)
          testResult = response.ok
        } catch {
          testResult = false
        }
        break
    }

    if (testResult) {
      return NextResponse.json({ message: `${provider} API connection successful` })
    } else {
      return NextResponse.json({ message: `${provider} API connection failed` }, { status: 400 })
    }
  } catch (error) {
    console.error("❌ Error testing API:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
