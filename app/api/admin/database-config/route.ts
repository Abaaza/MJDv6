import { type NextRequest, NextResponse } from "next/server"
import { MongoClient } from "mongodb"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Test MongoDB connection
async function testMongoConnection(uri: string, dbName: string) {
  const startTime = Date.now()
  let client: MongoClient | null = null

  try {
    console.log("🔍 Testing MongoDB connection...")
    client = new MongoClient(uri)
    await client.connect()

    const db = client.db(dbName)
    const adminDb = client.db().admin()
    const serverStatus = await adminDb.serverStatus()
    const dbStats = await db.stats()
    const collections = await db.listCollections().toArray()

    const testCollection = db.collection("connection_test")
    const testDoc = { timestamp: new Date(), test: true, configTest: true }
    await testCollection.insertOne(testDoc)
    await testCollection.deleteOne({ configTest: true })

    const responseTime = Date.now() - startTime

    return {
      success: true,
      connectionTime: responseTime,
      server: {
        version: serverStatus.version,
        uptime: serverStatus.uptime,
        host: serverStatus.host,
        process: serverStatus.process,
      },
      database: {
        name: dbName,
        collections: collections.length,
        dataSize: dbStats.dataSize,
        storageSize: dbStats.storageSize,
        indexes: dbStats.indexes,
        objects: dbStats.objects,
      },
      collections: collections.map((col) => ({
        name: col.name,
        type: col.type,
      })),
    }
  } catch (error) {
    const responseTime = Date.now() - startTime
    console.error("❌ MongoDB connection failed:", error)

    return {
      success: false,
      connectionTime: responseTime,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  } finally {
    if (client) {
      await client.close()
    }
  }
}

// GET - Get current database configuration (NO AUTH)
export async function GET() {
  console.log("🔧 GET Database Config (NO AUTH)")

  try {
    const currentConfig = {
      mongoUri: process.env.MONGODB_URI ? "***configured***" : null,
      dbName: process.env.MONGODB_DB || process.env.DB_NAME || "construction_crm",
      hasConnection: !!process.env.MONGODB_URI,
    }

    let connectionTest = null
    if (process.env.MONGODB_URI) {
      connectionTest = await testMongoConnection(
        process.env.MONGODB_URI,
        process.env.MONGODB_DB || process.env.DB_NAME || "construction_crm",
      )
    }

    return NextResponse.json({
      config: currentConfig,
      connectionTest,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ Error getting database config:", error)
    return NextResponse.json({ message: "Failed to get database configuration" }, { status: 500 })
  }
}

// POST - Update database configuration (NO AUTH)
export async function POST(req: NextRequest) {
  console.log("🔧 POST Database Config (NO AUTH)")

  try {
    const body = await req.json()
    const { mongoUri, dbName, testOnly = false } = body

    if (!mongoUri || !dbName) {
      return NextResponse.json({ message: "MongoDB URI and database name are required" }, { status: 400 })
    }

    const testResult = await testMongoConnection(mongoUri, dbName)

    if (!testResult.success) {
      return NextResponse.json(
        {
          message: "Connection test failed",
          error: testResult.error,
          testResult,
        },
        { status: 400 },
      )
    }

    if (testOnly) {
      return NextResponse.json({
        message: "Connection test successful",
        testResult,
        timestamp: new Date().toISOString(),
      })
    }

    return NextResponse.json({
      message: "Database configuration tested successfully",
      note: "To apply changes, update your environment variables and restart the application",
      testResult,
      instructions: {
        step1: "Update MONGODB_URI in your environment variables",
        step2: "Update MONGODB_DB in your environment variables",
        step3: "Restart your application to apply changes",
        envVars: {
          MONGODB_URI: "Your new MongoDB URI",
          MONGODB_DB: dbName,
        },
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ Error updating database config:", error)
    return NextResponse.json({ message: "Failed to update database configuration" }, { status: 500 })
  }
}
