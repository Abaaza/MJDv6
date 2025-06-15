import { MongoClient, type Db } from "mongodb"

let client: MongoClient
let db: Db

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (!client) {
    const uri = process.env.MONGODB_URI
    if (!uri) {
      throw new Error("MONGODB_URI environment variable is not set")
    }

    client = new MongoClient(uri)
    await client.connect()
    console.log("✅ Connected to MongoDB")
  }

  if (!db) {
    const dbName = process.env.MONGODB_DB || process.env.DB_NAME || "construction_crm"
    db = client.db(dbName)
    console.log("✅ Connected to database:", dbName)
  }

  return { client, db }
}
