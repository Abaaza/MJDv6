import { NextResponse } from "next/server"
import { MongoClient } from "mongodb"

export async function GET() {
  console.log("🔥 EXPORT - ZERO AUTH - DIRECT MONGODB")

  try {
    // Direct MongoDB connection - no service layer
    const client = new MongoClient(process.env.MONGODB_URI!)
    await client.connect()

    const db = client.db(process.env.DB_NAME || "construction_crm")

    // Try different collection names
    let collection = db.collection("price_items")
    let items = await collection.find({}).limit(10).toArray()

    if (items.length === 0) {
      console.log("🔍 Trying 'priceitems' collection...")
      collection = db.collection("priceitems")
      items = await collection.find({}).limit(10).toArray()
    }

    if (items.length === 0) {
      console.log("🔍 Trying 'priceItems' collection...")
      collection = db.collection("priceItems")
      items = await collection.find({}).limit(10).toArray()
    }

    // Get all items if we found the right collection
    if (items.length > 0) {
      items = await collection.find({}).toArray()
    }

    await client.close()

    console.log(`📊 Found ${items.length} items for export`)

    if (items.length === 0) {
      // List all collections to debug
      const client2 = new MongoClient(process.env.MONGODB_URI!)
      await client2.connect()
      const db2 = client2.db(process.env.DB_NAME || "construction_crm")
      const collections = await db2.listCollections().toArray()
      await client2.close()

      console.log(
        "📋 Available collections:",
        collections.map((c) => c.name),
      )
      return NextResponse.json(
        {
          error: "No items found",
          availableCollections: collections.map((c) => c.name),
        },
        { status: 404 },
      )
    }

    // Create simple CSV
    const headers = ["ID", "Code", "Description", "Rate", "Unit", "Category", "Sub Category"]
    const csvRows = [headers.join(",")]

    items.forEach((item) => {
      const row = [
        item._id?.toString() || "",
        `"${(item.code || "").replace(/"/g, '""')}"`,
        `"${(item.description || "").replace(/"/g, '""')}"`,
        item.rate || 0,
        `"${(item.unit || "").replace(/"/g, '""')}"`,
        `"${(item.category || "").replace(/"/g, '""')}"`,
        `"${(item.subCategory || "").replace(/"/g, '""')}"`,
      ]
      csvRows.push(row.join(","))
    })

    const csvContent = csvRows.join("\n")

    console.log("✅ CSV generated successfully")

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="price-items-export.csv"',
      },
    })
  } catch (error) {
    console.error("❌ Export error:", error)
    return NextResponse.json({ error: "Export failed", details: error.message }, { status: 500 })
  }
}
