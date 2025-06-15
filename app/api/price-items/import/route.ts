import { type NextRequest, NextResponse } from "next/server"
import { MongoDBService } from "@/lib/mongodb-service"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  console.log("📥 === IMPORT PRICE ITEMS API (NO AUTH) ===")

  try {
    const formData = await req.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ message: "No file uploaded" }, { status: 400 })
    }

    console.log("📄 Processing file:", file.name, file.size, "bytes")

    const text = await file.text()
    const lines = text.split("\n").filter((line) => line.trim())

    if (lines.length < 2) {
      return NextResponse.json({ message: "File must contain at least a header and one data row" }, { status: 400 })
    }

    const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))
    console.log("📊 CSV headers:", headers)

    const requiredFields = ["description"]
    const missingFields = requiredFields.filter((field) => !headers.some((h) => h.toLowerCase().includes(field)))

    if (missingFields.length > 0) {
      return NextResponse.json({ message: `Missing required fields: ${missingFields.join(", ")}` }, { status: 400 })
    }

    await MongoDBService.connect()

    const importedItems = []
    const errors = []

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(",").map((v) => v.trim().replace(/"/g, ""))
        const item: any = {}

        headers.forEach((header, index) => {
          const value = values[index] || ""
          const lowerHeader = header.toLowerCase()

          if (lowerHeader.includes("code")) item.code = value.toUpperCase()
          else if (lowerHeader.includes("ref")) item.ref = value
          else if (lowerHeader.includes("description")) item.description = value
          else if (lowerHeader.includes("category") && !lowerHeader.includes("sub")) item.category = value
          else if (lowerHeader.includes("sub") && lowerHeader.includes("category")) item.subCategory = value
          else if (lowerHeader.includes("unit")) item.unit = value
          else if (lowerHeader.includes("rate") || lowerHeader.includes("price")) {
            const numValue = Number.parseFloat(value.replace(/[^0-9.-]/g, ""))
            if (!Number.isNaN(numValue)) item.rate = numValue
          } else if (lowerHeader.includes("keyword")) {
            item.keywords = value
              ? value
                  .split(";")
                  .map((k) => k.trim())
                  .filter(Boolean)
              : []
          } else if (lowerHeader.includes("phrase")) {
            item.phrases = value
              ? value
                  .split(";")
                  .map((p) => p.trim())
                  .filter(Boolean)
              : []
          }
        })

        if (!item.description) {
          errors.push(`Row ${i + 1}: Missing description`)
          continue
        }

        const newItem = await MongoDBService.createPriceItem(item)
        importedItems.push(newItem)
      } catch (error) {
        errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : "Unknown error"}`)
      }
    }

    console.log("✅ Import completed:", {
      imported: importedItems.length,
      errors: errors.length,
    })

    return NextResponse.json({
      message: `Import completed: ${importedItems.length} items imported`,
      imported: importedItems.length,
      errors: errors.length,
      errorDetails: errors.slice(0, 10),
    })
  } catch (error) {
    console.error("❌ Import error:", error)
    return NextResponse.json({ message: "Import failed" }, { status: 500 })
  }
}
