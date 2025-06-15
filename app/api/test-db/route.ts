import { NextResponse } from "next/server"
import { MongoClient } from "mongodb"

export async function GET() {
  const startTime = Date.now()

  try {
    console.log("🔍 Testing MongoDB connection...")
    console.log("📍 MongoDB URI exists:", !!process.env.MONGODB_URI)
    console.log("📍 Database name:", process.env.MONGODB_DB || process.env.DB_NAME || "construction_crm")

    if (!process.env.MONGODB_URI) {
      return NextResponse.json(
        {
          success: false,
          message: "MongoDB URI not configured",
          error: "MONGODB_URI environment variable is missing",
          troubleshooting: {
            issue: "Missing environment variable",
            solution: "Add MONGODB_URI to your environment variables",
            example: "MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database",
          },
        },
        { status: 500 },
      )
    }

    // Test connection
    const client = new MongoClient(process.env.MONGODB_URI)
    await client.connect()

    const dbName = process.env.MONGODB_DB || process.env.DB_NAME || "construction_crm"
    const db = client.db(dbName)

    // Test database operations
    const adminDb = client.db().admin()
    const serverStatus = await adminDb.serverStatus()

    // Get database stats
    const dbStats = await db.stats()

    // List collections
    const collections = await db.listCollections().toArray()

    // Test a simple operation
    const testCollection = db.collection("connection_test")
    const testDoc = { timestamp: new Date(), test: true }
    await testCollection.insertOne(testDoc)
    await testCollection.deleteOne({ test: true })

    const responseTime = Date.now() - startTime

    await client.close()

    console.log("✅ MongoDB connection test successful")

    return NextResponse.json({
      success: true,
      message: "MongoDB connection successful",
      data: {
        connectionTime: `${responseTime}ms`,
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
        environment: {
          nodeEnv: process.env.NODE_ENV,
          hasMongoUri: !!process.env.MONGODB_URI,
          hasDbName: !!(process.env.MONGODB_DB || process.env.DB_NAME),
        },
      },
    })
  } catch (error) {
    const responseTime = Date.now() - startTime
    console.error("❌ MongoDB connection failed:", error)

    let troubleshooting = {
      issue: "Unknown connection error",
      possibleCauses: [
        "Invalid MongoDB URI",
        "Network connectivity issues",
        "Database server is down",
        "Authentication failure",
      ],
      solutions: [
        "Verify your MongoDB URI is correct",
        "Check your network connection",
        "Ensure MongoDB server is running",
        "Verify username and password",
      ],
    }

    if (error instanceof Error) {
      if (error.message.includes("authentication")) {
        troubleshooting = {
          issue: "Authentication failed",
          possibleCauses: ["Invalid username or password", "User doesn't have required permissions"],
          solutions: ["Check your MongoDB credentials", "Verify user permissions in MongoDB Atlas"],
        }
      } else if (error.message.includes("network") || error.message.includes("timeout")) {
        troubleshooting = {
          issue: "Network connectivity problem",
          possibleCauses: ["Network firewall blocking connection", "MongoDB server unreachable"],
          solutions: [
            "Check firewall settings",
            "Verify MongoDB server is accessible",
            "Check IP whitelist in MongoDB Atlas",
          ],
        }
      } else if (error.message.includes("DNS")) {
        troubleshooting = {
          issue: "DNS resolution failed",
          possibleCauses: ["Invalid hostname in connection string", "DNS server issues"],
          solutions: ["Verify the hostname in your MongoDB URI", "Try using IP address instead of hostname"],
        }
      }
    }

    return NextResponse.json(
      {
        success: false,
        message: "MongoDB connection failed",
        error: error instanceof Error ? error.message : "Unknown error",
        connectionTime: `${responseTime}ms`,
        troubleshooting,
        environment: {
          nodeEnv: process.env.NODE_ENV,
          hasMongoUri: !!process.env.MONGODB_URI,
          hasDbName: !!(process.env.MONGODB_DB || process.env.DB_NAME),
          mongoUriPreview: process.env.MONGODB_URI
            ? process.env.MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, "//***:***@")
            : "Not set",
        },
      },
      { status: 500 },
    )
  }
}
