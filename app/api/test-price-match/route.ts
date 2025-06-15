import { NextResponse } from "next/server"
import { MongoDBService } from "@/lib/mongodb-service"
import { CohereMatcher } from "@/lib/cohere-matcher"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  console.log("🧪 Starting comprehensive price matching test...")

  try {
    // Test 1: Database Connection
    console.log("📊 Test 1: Database Connection")
    const isConnected = await MongoDBService.testConnection()
    if (!isConnected) {
      return NextResponse.json({
        success: false,
        error: "Database connection failed",
        tests: { databaseConnection: false },
      })
    }
    console.log("✅ Database connection successful")

    // Test 2: API Settings
    console.log("📊 Test 2: API Settings")
    const settings = await MongoDBService.getApiSettings()
    const hasCohere = !!settings.cohereApiKey
    const hasOpenAI = !!settings.openaiApiKey
    console.log("📊 API Keys status:", { hasCohere, hasOpenAI })

    // Test 3: Price List Data
    console.log("📊 Test 3: Price List Data")
    const { items: priceItems } = await MongoDBService.loadPriceList()
    const hasPriceData = priceItems.length > 1 // More than just mock data
    console.log("📊 Price items count:", priceItems.length)

    // Test 4: Sample Matching (if Cohere key available)
    let matchingTest = null
    if (hasCohere && hasPriceData) {
      console.log("📊 Test 4: Sample Price Matching")
      try {
        const matcher = new CohereMatcher(settings.cohereApiKey!)
        const sampleInquiry = ["concrete foundation work", "brick wall construction"]
        const samplePricelist = priceItems.slice(0, 10).map((item) => ({
          description: item.description || "",
          rate: item.rate || 0,
        }))

        const results = await matcher.matchItems(sampleInquiry, samplePricelist)
        matchingTest = {
          success: true,
          resultsCount: results.length,
          averageConfidence: results.reduce((sum, r) => sum + r.confidence, 0) / results.length,
          sampleResults: results.slice(0, 2),
        }
        console.log("✅ Sample matching test successful")
      } catch (error) {
        console.error("❌ Sample matching test failed:", error)
        matchingTest = {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        }
      }
    }

    // Test Results Summary
    const testResults = {
      databaseConnection: isConnected,
      apiKeysConfigured: { cohere: hasCohere, openai: hasOpenAI },
      priceDataAvailable: hasPriceData,
      priceItemsCount: priceItems.length,
      matchingTest,
      readyForPriceMatching: isConnected && hasCohere && hasPriceData,
    }

    console.log("🎉 Test completed successfully")
    console.log("📊 Final test results:", testResults)

    return NextResponse.json({
      success: true,
      message: "Price matching system test completed",
      timestamp: new Date().toISOString(),
      tests: testResults,
      recommendations: [
        !hasCohere ? "Configure Cohere API key in Admin Settings" : null,
        !hasPriceData ? "Import price list data or seed database" : null,
        !hasOpenAI ? "Configure OpenAI API key for advanced matching (optional)" : null,
      ].filter(Boolean),
    })
  } catch (error) {
    console.error("❌ Test failed:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    })
  }
}
