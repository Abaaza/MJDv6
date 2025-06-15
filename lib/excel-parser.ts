import * as XLSX from "xlsx"
import { ExcelFormulaHandler } from "./excel-formula-handler"

interface ParsedBoQItem {
  description: string
  unit?: string
  quantity?: number
  rate?: number
  rowIndex: number
  sheetName: string
}

interface ParsedBoQData {
  items: ParsedBoQItem[]
  headers: {
    descriptionColumn: number
    unitColumn?: number
    quantityColumn?: number
    rateColumn?: number
    headerRow: number
  }
  sheetName: string
}

export class ExcelParser {
  static async parseBoQFile(file: File): Promise<ParsedBoQData[]> {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: "array" })

      const results: ParsedBoQData[] = []

      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false })

        if (!jsonData.length) continue

        // Find headers (similar to your Python logic)
        const headers = this.findHeaders(jsonData as string[][])
        if (!headers) {
          console.log(`Skipping sheet '${sheetName}' - no valid headers found`)
          continue
        }

        // Extract items
        const items = this.extractItems(jsonData as string[][], headers, sheetName)

        if (items.length > 0) {
          results.push({
            items,
            headers,
            sheetName,
          })
          console.log(`Found ${items.length} items in sheet '${sheetName}'`)
        }
      }

      if (!results.length) {
        throw new Error("No valid BoQ data found in any sheet")
      }

      return results
    } catch (error) {
      console.error("Excel parsing error:", error)
      throw new Error(`Failed to parse Excel file: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  private static findHeaders(data: string[][]): {
    descriptionColumn: number
    unitColumn?: number
    quantityColumn?: number
    rateColumn?: number
    headerRow: number
  } | null {
    // Search first 10 rows for headers
    for (let rowIndex = 0; rowIndex < Math.min(10, data.length); rowIndex++) {
      const row = data[rowIndex]
      if (!row) continue

      let descCol: number | undefined
      let unitCol: number | undefined
      let qtyCol: number | undefined
      let rateCol: number | undefined

      for (let colIndex = 0; colIndex < row.length; colIndex++) {
        const cell = row[colIndex]
        if (!cell || typeof cell !== "string") continue

        const cellLower = cell.trim().toLowerCase()

        if (cellLower === "description" && !descCol) {
          descCol = colIndex
        } else if (cellLower === "rate" && !rateCol) {
          rateCol = colIndex
        } else if ((cellLower === "qty" || cellLower === "quantity") && !qtyCol) {
          qtyCol = colIndex
        } else if (cellLower === "unit" && !unitCol) {
          unitCol = colIndex
        }
      }

      // Must have at least description and rate columns
      if (descCol !== undefined && rateCol !== undefined) {
        return {
          descriptionColumn: descCol,
          unitColumn: unitCol,
          quantityColumn: qtyCol,
          rateColumn: rateCol,
          headerRow: rowIndex,
        }
      }
    }

    return null
  }

  private static extractItems(
    data: string[][],
    headers: {
      descriptionColumn: number
      unitColumn?: number
      quantityColumn?: number
      rateColumn?: number
      headerRow: number
    },
    sheetName: string,
  ): ParsedBoQItem[] {
    const items: ParsedBoQItem[] = []

    // Start from row after headers
    for (let rowIndex = headers.headerRow + 1; rowIndex < data.length; rowIndex++) {
      const row = data[rowIndex]
      if (!row) continue

      const description = row[headers.descriptionColumn]
      const rate = headers.rateColumn !== undefined ? row[headers.rateColumn] : undefined
      const unit = headers.unitColumn !== undefined ? row[headers.unitColumn] : undefined
      const quantity = headers.quantityColumn !== undefined ? row[headers.quantityColumn] : undefined

      // Skip if no description
      if (!description || typeof description !== "string" || !description.trim()) {
        continue
      }

      // Skip non-item rows
      if (this.isNonItem(description)) {
        continue
      }

      // Skip if quantity column exists but is empty
      if (headers.quantityColumn !== undefined && (!quantity || quantity.toString().trim() === "")) {
        continue
      }

      // Skip if rate is already filled (we only want empty rates to fill)
      if (rate && rate.toString().trim() !== "") {
        continue
      }

      items.push({
        description: description.trim(),
        unit: unit?.toString().trim(),
        quantity: quantity ? Number.parseFloat(quantity.toString()) : undefined,
        rate: rate ? Number.parseFloat(rate.toString()) : undefined,
        rowIndex,
        sheetName,
      })
    }

    return items
  }

  static isNonItem(text: string): boolean {
    if (!text) return true

    const s = text.trim().toLowerCase()
    if (s.length <= 2) return true

    const nonItemPatterns = [
      /^description/i,
      /^item$/i,
      /^code$/i,
      /^section/i,
      /^chapter/i,
      /^bill/i,
      /^total/i,
      /^sub.?total/i,
      /^ref$/i,
      /^page/i,
    ]

    return nonItemPatterns.some((pattern) => pattern.test(s))
  }

  static preprocessText(text: string): string {
    if (!text) return ""

    // Convert to lowercase and remove special characters
    let processed = text.toLowerCase()
    processed = processed.replace(/[^a-z0-9\s]/g, " ")
    processed = processed.replace(/\b\d+(?:\.\d+)?\b/g, " ") // Remove numbers
    processed = processed.replace(/\s+(mm|cm|m|inch|in|ft)\b/g, " ") // Remove units
    processed = processed.replace(/\s+/g, " ").trim()

    // Apply synonyms (from your Python code)
    const synonymMap: { [key: string]: string } = {
      bricks: "brick",
      brickwork: "brick",
      blocks: "brick",
      blockwork: "brick",
      cement: "concrete",
      footing: "foundation",
      footings: "foundation",
      excavation: "excavate",
      excavations: "excavate",
      installation: "install",
      installing: "install",
      demolition: "demolish",
      supply: "provide",
      supplies: "provide",
    }

    const words = processed.split(" ").map((word) => {
      // Apply stemming-like reduction
      if (word.length > 3) {
        word = word.replace(/(ings|ing|ed|es|s)$/, "")
      }
      return synonymMap[word] || word
    })

    // Remove stop words
    const stopWords = new Set([
      "the",
      "and",
      "of",
      "to",
      "in",
      "for",
      "on",
      "at",
      "by",
      "from",
      "with",
      "a",
      "an",
      "be",
      "is",
      "are",
      "as",
      "it",
      "its",
      "into",
      "or",
    ])

    return words.filter((word) => word && !stopWords.has(word)).join(" ")
  }

  static async generateOutputFile(
    originalFile: File,
    matchedItems: Array<{
      description: string
      matchedDescription: string
      rate: number
      confidence: number
      rowIndex: number
      sheetName: string
    }>,
  ): Promise<Blob> {
    try {
      const arrayBuffer = await originalFile.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: "array" })

      // Group matches by sheet
      const matchesBySheet = matchedItems.reduce(
        (acc, item) => {
          if (!acc[item.sheetName]) acc[item.sheetName] = []
          acc[item.sheetName].push(item)
          return acc
        },
        {} as Record<string, typeof matchedItems>,
      )

      // Update each sheet
      for (const [sheetName, matches] of Object.entries(matchesBySheet)) {
        const worksheet = workbook.Sheets[sheetName]
        if (!worksheet) continue

        // Add new columns for matched description and confidence
        const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1")
        const newCols = range.e.c + 1

        // Add headers
        XLSX.utils.sheet_add_aoa(worksheet, [["Matched Description", "Confidence Score"]], {
          origin: XLSX.utils.encode_cell({ r: 0, c: newCols }),
        })

        // Add matched data
        for (const match of matches) {
          XLSX.utils.sheet_add_aoa(worksheet, [[match.matchedDescription, match.confidence]], {
            origin: XLSX.utils.encode_cell({ r: match.rowIndex, c: newCols }),
          })

          // Update rate column (assuming it's found during parsing)
          // This would need the actual rate column index from parsing
          // For now, we'll add it as a comment or separate column
        }

        // Update range
        worksheet["!ref"] = XLSX.utils.encode_range({
          s: { r: 0, c: 0 },
          e: { r: range.e.r, c: newCols + 1 },
        })
      }

      // Generate output file
      const outputBuffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" })
      return new Blob([outputBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })
    } catch (error) {
      console.error("Output file generation error:", error)
      throw new Error(`Failed to generate output file: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  static async generateOutputFileWithFormatting(
    originalFile: File,
    matchedResults: Array<{
      originalDescription: string
      matchedDescription: string
      rate: number
      confidence: number
      quantity: number
      total: number
      rowIndex?: number
      sheetName?: string
    }>,
    model: string,
  ): Promise<Blob> {
    try {
      const arrayBuffer = await originalFile.arrayBuffer()

      // Use openpyxl-style loading to preserve ALL formatting
      const workbook = XLSX.read(arrayBuffer, {
        type: "array",
        cellStyles: true,
        cellHTML: false,
        cellFormula: true,
        cellDates: true,
        sheetStubs: true,
        bookDeps: true,
        bookSheets: true,
        bookProps: true,
        bookVBA: true,
      })

      // Process each sheet and find the exact rows to update
      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName]
        if (!worksheet) continue

        // Find headers to locate rate column
        const headers = this.findHeaders(XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false }) as string[][])
        if (!headers) continue

        // Filter results for this sheet
        const sheetResults = matchedResults.filter((r) => !r.sheetName || r.sheetName === sheetName)

        // Find all rows with descriptions that match our results
        const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1")

        for (let rowIdx = headers.headerRow + 1; rowIdx <= range.e.r; rowIdx++) {
          const descCellRef = XLSX.utils.encode_cell({ r: rowIdx, c: headers.descriptionColumn })
          const descCell = worksheet[descCellRef]

          if (!descCell || !descCell.v) continue

          const cellDescription = descCell.v.toString().trim()

          // Find matching result
          const matchedResult = sheetResults.find(
            (result) =>
              result.originalDescription.trim() === cellDescription ||
              this.preprocessText(result.originalDescription) === this.preprocessText(cellDescription),
          )

          if (matchedResult) {
            // Update the rate column in the EXACT same cell
            const rateCellRef = XLSX.utils.encode_cell({ r: rowIdx, c: headers.rateColumn })

            // Preserve the original cell object and just update the value
            if (!worksheet[rateCellRef]) {
              worksheet[rateCellRef] = { t: "n" }
            }

            // Keep all original formatting, just change the value
            worksheet[rateCellRef].v = matchedResult.rate
            worksheet[rateCellRef].w = matchedResult.rate.toString() // Display value

            // If there's a quantity column, update it too
            if (headers.quantityColumn !== undefined) {
              const qtyCellRef = XLSX.utils.encode_cell({ r: rowIdx, c: headers.quantityColumn })
              if (!worksheet[qtyCellRef]) {
                worksheet[qtyCellRef] = { t: "n" }
              }
              worksheet[qtyCellRef].v = matchedResult.quantity
              worksheet[qtyCellRef].w = matchedResult.quantity.toString()
            }
          }
        }

        // Optionally add a summary sheet with matching details (without affecting original sheets)
        // This preserves the original completely while adding insights
      }

      // Add a new "Matching Summary" sheet with details (optional)
      const summaryData = [
        ["Original Description", "Matched Description", "Rate", "Confidence", "Model", "Sheet"],
        ...matchedResults.map((r) => [
          r.originalDescription,
          r.matchedDescription,
          r.rate,
          `${r.confidence}%`,
          model.toUpperCase(),
          r.sheetName || "Sheet1",
        ]),
      ]

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
      XLSX.utils.book_append_sheet(workbook, summarySheet, "AI Matching Summary")

      // Generate the exact same file with updates
      const outputBuffer = XLSX.write(workbook, {
        type: "array",
        bookType: "xlsx",
        cellStyles: true, // Preserve all cell styles
        sheetStubs: false, // Don't add empty cells
        compression: true, // Keep file size reasonable
      })

      return new Blob([outputBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })
    } catch (error) {
      console.error("Output file generation error:", error)
      throw new Error(`Failed to generate output file: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  static async populateOriginalFile(
    originalFile: File,
    matchedResults: Array<{
      originalDescription: string
      rate: number
      quantity?: number
      rowIndex?: number
      sheetName?: string
    }>,
  ): Promise<Blob> {
    try {
      const arrayBuffer = await originalFile.arrayBuffer()

      // Load with maximum format preservation
      const workbook = XLSX.read(arrayBuffer, {
        type: "array",
        cellStyles: true,
        cellNF: true, // Preserve number formats
        cellHTML: false,
        cellFormula: true, // Preserve formulas
        cellDates: true,
        sheetStubs: true,
        bookDeps: true,
        bookSheets: true,
        bookProps: true,
        bookVBA: true,
        WTF: false,
      })

      // Process each sheet
      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName]
        if (!worksheet) continue

        // Find formulas before making changes
        const formulaCells = ExcelFormulaHandler.findFormulaCells(worksheet)

        // Get the original data to find headers
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          raw: false,
          defval: "",
        }) as string[][]

        const headers = this.findHeaders(jsonData)
        if (!headers) continue

        const updatedCells: { address: string; value: number }[] = []

        // Update only the cells that need updating
        const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1")

        for (let rowIdx = headers.headerRow + 1; rowIdx <= range.e.r; rowIdx++) {
          const descCellRef = XLSX.utils.encode_cell({ r: rowIdx, c: headers.descriptionColumn })
          const descCell = worksheet[descCellRef]

          if (!descCell?.v) continue

          const cellDescription = descCell.v.toString().trim()

          // Find exact match
          const matchedResult = matchedResults.find((result) => {
            if (result.rowIndex === rowIdx && result.sheetName === sheetName) return true
            return this.preprocessText(result.originalDescription) === this.preprocessText(cellDescription)
          })

          if (matchedResult) {
            // Update rate - preserve ALL original cell properties
            const rateCellRef = XLSX.utils.encode_cell({ r: rowIdx, c: headers.rateColumn })
            const originalRateCell = worksheet[rateCellRef] || {}

            worksheet[rateCellRef] = {
              ...originalRateCell,
              v: matchedResult.rate,
              t: "n",
            }

            updatedCells.push({ address: rateCellRef, value: matchedResult.rate })

            // Update quantity if provided and column exists
            if (matchedResult.quantity && headers.quantityColumn !== undefined) {
              const qtyCellRef = XLSX.utils.encode_cell({ r: rowIdx, c: headers.quantityColumn })
              const originalQtyCell = worksheet[qtyCellRef] || {}

              worksheet[qtyCellRef] = {
                ...originalQtyCell,
                v: matchedResult.quantity,
                t: "n",
              }

              updatedCells.push({ address: qtyCellRef, value: matchedResult.quantity })
            }
          }
        }

        // Update formulas that depend on changed cells
        if (updatedCells.length > 0) {
          ExcelFormulaHandler.updateFormulasAfterRateChanges(
            worksheet,
            updatedCells.map((c) => c.address),
            formulaCells,
          )
        }
      }

      // Write back with ALL formatting and formulas preserved
      const outputBuffer = XLSX.write(workbook, {
        type: "array",
        bookType: "xlsx",
        cellStyles: true,
        compression: false,
      })

      return new Blob([outputBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })
    } catch (error) {
      console.error("File population error:", error)
      throw new Error(`Failed to populate original file: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }
}
