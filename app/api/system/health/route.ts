import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb-service"

export async function GET() {
  console.log("🔍 === SYSTEM HEALTH CHECK START ===")

  const startTime = Date.now()
  let overall: "healthy" | "warning" | "critical" = "healthy"

  try {
    // Check Database
    console.log("🔌 Checking database connection...")
    const dbStartTime = Date.now()
    let databaseStatus: "connected" | "disconnected" | "slow" = "disconnected"
    let dbResponseTime = 0
    const dbConnections = 0

    try {
      const { db } = await connectToDatabase()
      dbResponseTime = Date.now() - dbStartTime

      // Test with a simple query
      await db.collection("priceItems").countDocuments({}, { limit: 1 })

      if (dbResponseTime > 2000) {
        databaseStatus = "slow"
        overall = "warning"
      } else {
        databaseStatus = "connected"
      }

      console.log(`✅ Database connected (${dbResponseTime}ms)`)
    } catch (error) {
      console.error("❌ Database connection failed:", error)
      databaseStatus = "disconnected"
      overall = "critical"
    }

    // Check AI Services
    console.log("🤖 Checking AI services...")
    let cohereStatus: "online" | "offline" | "limited" = "offline"
    let openaiStatus: "online" | "offline" | "limited" = "offline"

    // Check Cohere
    try {
      const cohereKey = process.env.COHERE_API_KEY
      if (cohereKey) {
        const response = await fetch("https://api.cohere.ai/v1/models", {
          headers: {
            Authorization: `Bearer ${cohereKey}`,
            "Content-Type": "application/json",
          },
          signal: AbortSignal.timeout(5000),
        })

        if (response.ok) {
          cohereStatus = "online"
          console.log("✅ Cohere API online")
        } else {
          cohereStatus = "limited"
          console.log("⚠️ Cohere API limited access")
        }
      } else {
        cohereStatus = "offline"
        console.log("❌ Cohere API key not configured")
      }
    } catch (error) {
      cohereStatus = "offline"
      console.error("❌ Cohere API check failed:", error)
    }

    // Check OpenAI
    try {
      const openaiKey = process.env.OPENAI_API_KEY
      if (openaiKey) {
        const response = await fetch("https://api.openai.com/v1/models", {
          headers: {
            Authorization: `Bearer ${openaiKey}`,
            "Content-Type": "application/json",
          },
          signal: AbortSignal.timeout(5000),
        })

        if (response.ok) {
          openaiStatus = "online"
          console.log("✅ OpenAI API online")
        } else {
          openaiStatus = "limited"
          console.log("⚠️ OpenAI API limited access")
        }
      } else {
        openaiStatus = "offline"
        console.log("❌ OpenAI API key not configured")
      }
    } catch (error) {
      openaiStatus = "offline"
      console.error("❌ OpenAI API check failed:", error)
    }

    // Calculate performance metrics (mock data for now)
    const successRate = Math.floor(Math.random() * 10) + 90 // 90-100%
    const avgResponseTime = Math.floor(Math.random() * 500) + 200 // 200-700ms
    const errorRate = Math.floor(Math.random() * 5) // 0-5%

    // Determine overall status
    if (databaseStatus === "disconnected" || (cohereStatus === "offline" && openaiStatus === "offline")) {
      overall = "critical"
    } else if (databaseStatus === "slow" || cohereStatus === "limited" || openaiStatus === "limited") {
      overall = "warning"
    }

    const totalTime = Date.now() - startTime
    console.log(`✅ Health check completed in ${totalTime}ms - Overall: ${overall}`)
    console.log("🔍 === SYSTEM HEALTH CHECK END ===")

    const healthData = {
      overall,
      database: {
        status: databaseStatus,
        responseTime: dbResponseTime,
        connections: dbConnections,
      },
      ai: {
        cohere: cohereStatus,
        openai: openaiStatus,
      },
      performance: {
        avgResponseTime,
        successRate,
        errorRate,
      },
      lastCheck: new Date().toISOString(),
    }

    return NextResponse.json(healthData)
  } catch (error) {
    console.error("❌ System health check failed:", error)
    return NextResponse.json(
      {
        overall: "critical",
        database: { status: "disconnected", responseTime: 0, connections: 0 },
        ai: { cohere: "offline", openai: "offline" },
        performance: {
          avgResponseTime: 0,
          successRate: 0,
          errorRate: 100,
        },
        lastCheck: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
