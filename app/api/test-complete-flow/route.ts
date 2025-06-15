import { NextResponse } from "next/server"
import { MongoDBService } from "@/lib/mongodb-service"
import { CohereMatcher } from "@/lib/cohere-matcher"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const startTime = Date.now()
  console.log("🧪 === COMPLETE FLOW TEST START ===")
  console.log("📊 Test initiated at:", new Date().toISOString())

  try {
    // Test 1: Database Connection with detailed logging
    console.log("\n📊 === TEST 1: DATABASE CONNECTION ===")
    console.log("🔄 Testing MongoDB connection...")
    const connectionStart = Date.now()
    const isConnected = await MongoDBService.testConnection()
    const connectionTime = Date.now() - connectionStart

    console.log("📊 Connection test result:", {
      success: isConnected,
      timeMs: connectionTime,
      timestamp: new Date().toISOString(),
    })

    if (!isConnected) {
      console.log("❌ Database connection failed - aborting test")
      return NextResponse.json({
        success: false,
        error: "Database connection failed",
        testDuration: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      })
    }

    // Test 2: API Settings with detailed logging
    console.log("\n📊 === TEST 2: API SETTINGS ===")
    console.log("🔄 Fetching API settings from database...")
    const settingsStart = Date.now()
    const settings = await MongoDBService.getApiSettings()
    const settingsTime = Date.now() - settingsStart

    console.log("📊 API settings result:", {
      hasCohere: !!settings.cohereApiKey,
      cohereKeyLength: settings.cohereApiKey?.length || 0,
      hasOpenAI: !!settings.openaiApiKey,
      openaiKeyLength: settings.openaiApiKey?.length || 0,
      hasGemini: !!settings.geminiApiKey,
      geminiKeyLength: settings.geminiApiKey?.length || 0,
      fetchTimeMs: settingsTime,
      timestamp: new Date().toISOString(),
    })

    // Test 3: Price List Data with detailed logging
    console.log("\n📊 === TEST 3: PRICE LIST DATA ===")
    console.log("🔄 Loading price list from database...")
    const priceListStart = Date.now()
    const { items: priceItems, descriptions, rates } = await MongoDBService.loadPriceList()
    const priceListTime = Date.now() - priceListStart

    console.log("📊 Price list result:", {
      itemsCount: priceItems.length,
      descriptionsCount: descriptions.length,
      ratesCount: rates.length,
      hasMockData: priceItems.some((item) => item.description?.includes("Mock")),
      categories: [...new Set(priceItems.map((item) => item.category).filter(Boolean))],
      sampleItems: priceItems.slice(0, 3).map((item) => ({
        description: item.description,
        rate: item.rate,
        category: item.category,
      })),
      loadTimeMs: priceListTime,
      timestamp: new Date().toISOString(),
    })

    const hasPriceData = priceItems.length > 1 && !priceItems.every((item) => item.description?.includes("Mock"))
    console.log("📊 Price data validation:", {
      hasPriceData,
      reason: hasPriceData ? "Valid data found" : "Only mock data or insufficient data",
    })

    // Test 4: Sample Matching with extensive logging
    let matchingTest = null
    const hasCohere = !!settings.cohereApiKey

    if (hasCohere && hasPriceData) {
      console.log("\n📊 === TEST 4: SAMPLE PRICE MATCHING ===")
      console.log("🔄 Initializing Cohere matcher...")

      try {
        const matchingStart = Date.now()
        const matcher = new CohereMatcher(settings.cohereApiKey!)

        const sampleInquiry = [
          "concrete foundation work 200mm thick",
          "brick wall construction single skin",
          "excavation for foundation 1.5m deep",
        ]

        const samplePricelist = priceItems.slice(0, 20).map((item) => ({
          description: item.description || "",
          rate: item.rate || 0,
        }))

        console.log("📊 Sample matching parameters:", {
          inquiryItems: sampleInquiry,
          pricelistItemsCount: samplePricelist.length,
          samplePricelistItems: samplePricelist.slice(0, 3),
          timestamp: new Date().toISOString(),
        })

        console.log("🤖 Starting AI matching process...")
        const results = await matcher.matchItems(sampleInquiry, samplePricelist, (progress, message) => {
          console.log(`📈 Matching Progress: ${progress}% - ${message}`)
        })

        const matchingTime = Date.now() - matchingStart
        const averageConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length

        console.log("📊 Matching results analysis:", {
          resultsCount: results.length,
          averageConfidence,
          highConfidenceCount: results.filter((r) => r.confidence >= 80).length,
          mediumConfidenceCount: results.filter((r) => r.confidence >= 60 && r.confidence < 80).length,
          lowConfidenceCount: results.filter((r) => r.confidence < 60).length,
          detailedResults: results.map((result, index) => ({
            inquiry: sampleInquiry[index],
            match: result.bestMatch,
            confidence: result.confidence,
            rate: result.bestRate,
            similarityScore: result.similarityScore,
            jaccardScore: result.jaccardScore,
          })),
          processingTimeMs: matchingTime,
          timestamp: new Date().toISOString(),
        })

        matchingTest = {
          success: true,
          resultsCount: results.length,
          averageConfidence,
          processingTimeMs: matchingTime,
          detailedResults: results,
          performanceMetrics: {
            itemsPerSecond: (results.length / matchingTime) * 1000,
            averageTimePerItem: matchingTime / results.length,
          },
        }

        console.log("✅ Sample matching test completed successfully")
      } catch (error) {
        console.error("❌ Sample matching test failed:", error)
        console.error("🔍 Error details:", {
          message: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : "No stack trace",
          timestamp: new Date().toISOString(),
        })

        matchingTest = {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
          errorDetails: error instanceof Error ? error.stack : null,
        }
      }
    } else {
      console.log("\n⚠️ === TEST 4: SKIPPED ===")
      console.log("📊 Skipping matching test:", {
        hasCohere,
        hasPriceData,
        reason: !hasCohere ? "No Cohere API key" : "No price data",
      })
    }

    // Test 5: Database Save Test
    console.log("\n📊 === TEST 5: DATABASE SAVE TEST ===")
    console.log("🔄 Testing matching job save functionality...")

    try {
      const saveStart = Date.now()
      const testJobData = {
        projectId: "test-project-" + Date.now(),
        model: "v0",
        status: "completed",
        progress: 100,
        logs: ["Test log entry 1", "Test log entry 2"],
        results: matchingTest?.detailedResults || [],
        fileInfo: {
          name: "test-file.xlsx",
          size: 12345,
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
      }

      console.log("📊 Test job data:", testJobData)
      const saveResult = await MongoDBService.saveMatchingJob(testJobData)
      const saveTime = Date.now() - saveStart

      console.log("✅ Database save test successful:", {
        jobId: saveResult.id,
        saveTimeMs: saveTime,
        timestamp: new Date().toISOString(),
      })
    } catch (saveError) {
      console.error("❌ Database save test failed:", saveError)
    }

    // Final Test Results Summary
    const totalTestTime = Date.now() - startTime
    const testResults = {
      databaseConnection: {
        success: isConnected,
        timeMs: connectionTime,
      },
      apiKeysConfigured: {
        cohere: hasCohere,
        openai: !!settings.openaiApiKey,
        gemini: !!settings.geminiApiKey,
      },
      priceDataAvailable: {
        success: hasPriceData,
        itemsCount: priceItems.length,
        loadTimeMs: priceListTime,
      },
      matchingTest,
      readyForPriceMatching: isConnected && hasCohere && hasPriceData,
      performanceMetrics: {
        totalTestTimeMs: totalTestTime,
        databaseConnectionTimeMs: connectionTime,
        priceListLoadTimeMs: priceListTime,
        matchingTimeMs: matchingTest?.processingTimeMs || 0,
      },
    }

    console.log("\n🎉 === COMPLETE FLOW TEST SUMMARY ===")
    console.log("📊 Final test results:", testResults)
    console.log("⏱️ Total test duration:", totalTestTime + "ms")
    console.log("🏁 Test completed at:", new Date().toISOString())

    return NextResponse.json({
      success: true,
      message: "Complete flow test finished",
      timestamp: new Date().toISOString(),
      testDuration: totalTestTime,
      tests: testResults,
      recommendations: [
        !hasCohere ? "❗ Configure Cohere API key in Admin Settings" : null,
        !hasPriceData ? "❗ Import price list data or seed database" : null,
        !settings.openaiApiKey ? "💡 Configure OpenAI API key for advanced matching (optional)" : null,
        testResults.readyForPriceMatching ? "✅ System is ready for price matching!" : null,
      ].filter(Boolean),
      nextSteps: testResults.readyForPriceMatching
        ? [
            "1. Go to /price-matcher",
            "2. Upload a BoQ file",
            "3. Select matching version (v0 for Cohere)",
            "4. Click 'Start Match'",
            "5. Monitor console logs for detailed progress",
          ]
        : [
            "1. Fix the issues mentioned in recommendations",
            "2. Re-run this test",
            "3. Proceed with price matching when ready",
          ],
    })
  } catch (error) {
    const totalTestTime = Date.now() - startTime
    console.error("❌ === COMPLETE FLOW TEST FAILED ===")
    console.error("🔍 Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : "No stack trace",
      testDuration: totalTestTime,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
      testDuration: totalTestTime,
      errorDetails: error instanceof Error ? error.stack : null,
    })
  }
}
