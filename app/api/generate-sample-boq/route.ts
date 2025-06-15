import { NextResponse } from "next/server"
import * as XLSX from "xlsx"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  console.log("📄 Generating sample BoQ file...")

  try {
    // Sample BoQ data for testing
    const sampleBoQData = [
      ["Description", "Unit", "Quantity", "Rate"],
      ["Excavation for foundation in ordinary soil", "m3", 150, ""],
      ["Concrete grade 25 for foundation", "m3", 85, ""],
      ["Common brick walling 230mm thick", "m2", 250, ""],
      ["Reinforcement steel bars grade 60", "kg", 2500, ""],
      ["Ceramic floor tiles 300x300mm", "m2", 180, ""],
      ["Plastering internal walls with cement mortar", "m2", 320, ""],
      ["Painting walls with emulsion paint", "m2", 320, ""],
      ["Electrical wiring and installation", "point", 45, ""],
      ["Plumbing and sanitary installation", "set", 8, ""],
      ["Roofing with concrete tiles", "m2", 200, ""],
    ]

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.aoa_to_sheet(sampleBoQData)

    // Add some styling (basic)
    const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1")

    // Set column widths
    worksheet["!cols"] = [
      { width: 50 }, // Description
      { width: 10 }, // Unit
      { width: 12 }, // Quantity
      { width: 12 }, // Rate
    ]

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "BoQ Sample")

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })

    console.log("✅ Sample BoQ file generated successfully")

    return new Response(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": "attachment; filename=sample-boq.xlsx",
      },
    })
  } catch (error) {
    console.error("❌ Error generating sample BoQ:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
