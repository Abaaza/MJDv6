import { type NextRequest, NextResponse } from "next/server"
import { ExcelParser } from "@/lib/excel-parser"

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const originalFile = formData.get("originalFile") as File
    const resultsJson = formData.get("results") as string
    const model = formData.get("model") as string
    const exportType = (formData.get("exportType") as string) || "populate" // "populate" or "enhanced"

    if (!originalFile || !resultsJson) {
      return NextResponse.json({ error: "Missing required data" }, { status: 400 })
    }

    const results = JSON.parse(resultsJson)

    let outputBlob: Blob

    if (exportType === "populate") {
      // Just populate the original file with rates - no extra columns
      outputBlob = await ExcelParser.populateOriginalFile(originalFile, results)
    } else {
      // Enhanced version with additional columns
      outputBlob = await ExcelParser.generateOutputFileWithFormatting(originalFile, results, model)
    }

    const headers = new Headers()
    headers.set("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")

    const filename =
      exportType === "populate"
        ? `${originalFile.name.replace(".xlsx", "")}-filled.xlsx`
        : `${originalFile.name.replace(".xlsx", "")}-with-analysis.xlsx`

    headers.set("Content-Disposition", `attachment; filename="${filename}"`)

    return new Response(outputBlob, { headers })
  } catch (error) {
    console.error("Excel export error:", error)
    return NextResponse.json(
      { error: `Export failed: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 },
    )
  }
}
