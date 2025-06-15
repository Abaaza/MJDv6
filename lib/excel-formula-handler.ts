import * as XLSX from "xlsx"

interface FormulaCell {
  address: string
  formula: string
  dependencies: string[]
}

export class ExcelFormulaHandler {
  static findFormulaCells(worksheet: XLSX.WorkSheet): FormulaCell[] {
    const formulaCells: FormulaCell[] = []
    const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1")

    for (let row = range.s.r; row <= range.e.r; row++) {
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col })
        const cell = worksheet[cellAddress]

        if (cell && cell.f) {
          // This cell has a formula
          const dependencies = this.extractFormulaDependencies(cell.f)
          formulaCells.push({
            address: cellAddress,
            formula: cell.f,
            dependencies,
          })
        }
      }
    }

    return formulaCells
  }

  private static extractFormulaDependencies(formula: string): string[] {
    // Extract cell references from formula (e.g., A1, B2:B10, etc.)
    const cellRefPattern = /[A-Z]+\d+(?::[A-Z]+\d+)?/g
    const matches = formula.match(cellRefPattern) || []
    return [...new Set(matches)] // Remove duplicates
  }

  static updateFormulasAfterRateChanges(
    worksheet: XLSX.WorkSheet,
    updatedCells: string[],
    formulaCells: FormulaCell[],
  ): void {
    // Find formulas that depend on updated cells
    const affectedFormulas = formulaCells.filter((formulaCell) =>
      formulaCell.dependencies.some((dep) => {
        // Check if any dependency overlaps with updated cells
        return updatedCells.some((updatedCell) => {
          if (dep.includes(":")) {
            // Range dependency (e.g., B2:B10)
            const [start, end] = dep.split(":")
            const startPos = XLSX.utils.decode_cell(start)
            const endPos = XLSX.utils.decode_cell(end)
            const updatedPos = XLSX.utils.decode_cell(updatedCell)

            return (
              updatedPos.r >= startPos.r &&
              updatedPos.r <= endPos.r &&
              updatedPos.c >= startPos.c &&
              updatedPos.c <= endPos.c
            )
          } else {
            // Single cell dependency
            return dep === updatedCell
          }
        })
      }),
    )

    // Mark affected formulas for recalculation
    for (const formulaCell of affectedFormulas) {
      const cell = worksheet[formulaCell.address]
      if (cell) {
        // Remove cached value to force recalculation
        delete cell.v
        delete cell.w
        // Keep the formula
        cell.f = formulaCell.formula
      }
    }
  }

  static preserveFormulasInExport(
    originalWorksheet: XLSX.WorkSheet,
    updatedCells: { address: string; value: number }[],
  ): XLSX.WorkSheet {
    // Clone the worksheet
    const newWorksheet = { ...originalWorksheet }

    // Find all formula cells before making changes
    const formulaCells = this.findFormulaCells(originalWorksheet)

    // Update the specified cells
    const updatedAddresses: string[] = []
    for (const update of updatedCells) {
      const cell = newWorksheet[update.address] || {}
      newWorksheet[update.address] = {
        ...cell,
        v: update.value,
        t: "n",
      }
      updatedAddresses.push(update.address)
    }

    // Update formulas that depend on changed cells
    this.updateFormulasAfterRateChanges(newWorksheet, updatedAddresses, formulaCells)

    return newWorksheet
  }

  static addTotalFormulas(
    worksheet: XLSX.WorkSheet,
    rateColumn: number,
    quantityColumn: number,
    startRow: number,
    endRow: number,
  ): void {
    // Add a "Total" column if it doesn't exist
    const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1")
    const totalColumn = range.e.c + 1

    // Add header
    const headerCell = XLSX.utils.encode_cell({ r: startRow - 1, c: totalColumn })
    worksheet[headerCell] = { v: "Total", t: "s" }

    // Add formulas for each row
    for (let row = startRow; row <= endRow; row++) {
      const totalCellAddress = XLSX.utils.encode_cell({ r: row, c: totalColumn })
      const rateCellAddress = XLSX.utils.encode_cell({ r: row, c: rateColumn })
      const qtyCellAddress = XLSX.utils.encode_cell({ r: row, c: quantityColumn })

      worksheet[totalCellAddress] = {
        f: `${rateCellAddress}*${qtyCellAddress}`,
        t: "n",
      }
    }

    // Add grand total formula
    const grandTotalRow = endRow + 1
    const grandTotalAddress = XLSX.utils.encode_cell({ r: grandTotalRow, c: totalColumn })
    const totalRangeStart = XLSX.utils.encode_cell({ r: startRow, c: totalColumn })
    const totalRangeEnd = XLSX.utils.encode_cell({ r: endRow, c: totalColumn })

    worksheet[grandTotalAddress] = {
      f: `SUM(${totalRangeStart}:${totalRangeEnd})`,
      t: "n",
    }

    // Update worksheet range
    worksheet["!ref"] = XLSX.utils.encode_range({
      s: { r: 0, c: 0 },
      e: { r: grandTotalRow, c: totalColumn },
    })
  }
}
