import { NextResponse } from "next/server"
import { MongoClient, ObjectId } from "mongodb"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  console.log("🔥 GET PRICE ITEM - ZERO AUTH - ID:", params.id)

  try {
    // Direct MongoDB connection - no service layer
    const client = new MongoClient(process.env.MONGODB_URI!)
    await client.connect()

    const db = client.db(process.env.DB_NAME || "construction_crm")
    const collection = db.collection("price_items")

    // Try both ObjectId and string formats
    let item
    try {
      item = await collection.findOne({ _id: new ObjectId(params.id) })
    } catch {
      item = await collection.findOne({ _id: params.id })
    }

    await client.close()

    if (!item) {
      console.log("❌ Item not found with ID:", params.id)
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    console.log("✅ Found item:", item.description)
    return NextResponse.json({ success: true, item })
  } catch (error) {
    console.error("❌ Error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  console.log("🔥 PUT PRICE ITEM - ZERO AUTH - ID:", params.id)

  try {
    const body = await request.json()
    console.log("📝 Update data:", body)

    // Direct MongoDB connection - no service layer
    const client = new MongoClient(process.env.MONGODB_URI!)
    await client.connect()

    const db = client.db(process.env.DB_NAME || "construction_crm")
    const collection = db.collection("price_items")

    // Try both ObjectId and string formats
    let result
    try {
      result = await collection.updateOne(
        { _id: new ObjectId(params.id) },
        { $set: { ...body, updatedAt: new Date() } },
      )
    } catch {
      result = await collection.updateOne({ _id: params.id }, { $set: { ...body, updatedAt: new Date() } })
    }

    if (result.matchedCount === 0) {
      await client.close()
      console.log("❌ Item not found for update:", params.id)
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    // Get updated item
    let updatedItem
    try {
      updatedItem = await collection.findOne({ _id: new ObjectId(params.id) })
    } catch {
      updatedItem = await collection.findOne({ _id: params.id })
    }

    await client.close()

    console.log("✅ Updated successfully")
    return NextResponse.json({ success: true, message: "Price item updated successfully", item: updatedItem })
  } catch (error) {
    console.error("❌ Error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  console.log("🔥 DELETE PRICE ITEM - ZERO AUTH - ID:", params.id)

  try {
    // Direct MongoDB connection - no service layer
    const client = new MongoClient(process.env.MONGODB_URI!)
    await client.connect()

    const db = client.db(process.env.DB_NAME || "construction_crm")
    const collection = db.collection("price_items")

    // Try both ObjectId and string formats
    let result
    try {
      result = await collection.deleteOne({ _id: new ObjectId(params.id) })
    } catch {
      result = await collection.deleteOne({ _id: params.id })
    }

    await client.close()

    if (result.deletedCount === 0) {
      console.log("❌ Item not found for deletion:", params.id)
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    console.log("✅ Deleted successfully")
    return NextResponse.json({ success: true, message: "Price item deleted successfully" })
  } catch (error) {
    console.error("❌ Error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
