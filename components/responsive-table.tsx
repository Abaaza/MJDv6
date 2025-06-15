"use client"

import type React from "react"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronRight } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"

interface Column {
  key: string
  label: string
  render?: (value: any, row: any) => React.ReactNode
  mobile?: boolean // Show on mobile
  priority?: number // 1 = highest priority for mobile
}

interface ResponsiveTableProps {
  data: any[]
  columns: Column[]
  onRowClick?: (row: any) => void
  emptyMessage?: string
}

export function ResponsiveTable({
  data,
  columns,
  onRowClick,
  emptyMessage = "No data available",
}: ResponsiveTableProps) {
  const isMobile = useIsMobile()
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())

  const toggleRow = (index: number) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedRows(newExpanded)
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>{emptyMessage}</p>
      </div>
    )
  }

  // Mobile Card View
  if (isMobile) {
    const primaryColumns = columns
      .filter((col) => col.mobile !== false)
      .sort((a, b) => (a.priority || 999) - (b.priority || 999))
      .slice(0, 3) // Show max 3 columns on mobile

    const secondaryColumns = columns.filter((col) => !primaryColumns.includes(col))

    return (
      <div className="space-y-3">
        {data.map((row, index) => (
          <Card key={index} className="overflow-hidden">
            <CardContent className="p-4">
              {/* Primary Info */}
              <div className="space-y-2">
                {primaryColumns.map((column) => (
                  <div key={column.key} className="flex justify-between items-start">
                    <span className="text-sm font-medium text-muted-foreground">{column.label}:</span>
                    <span className="text-sm font-medium text-right flex-1 ml-2">
                      {column.render ? column.render(row[column.key], row) : row[column.key]}
                    </span>
                  </div>
                ))}
              </div>

              {/* Expandable Secondary Info */}
              {secondaryColumns.length > 0 && (
                <>
                  <Button variant="ghost" size="sm" className="w-full mt-3 h-8" onClick={() => toggleRow(index)}>
                    {expandedRows.has(index) ? (
                      <>
                        <ChevronDown className="h-4 w-4 mr-1" />
                        Less Details
                      </>
                    ) : (
                      <>
                        <ChevronRight className="h-4 w-4 mr-1" />
                        More Details
                      </>
                    )}
                  </Button>

                  {expandedRows.has(index) && (
                    <div className="mt-3 pt-3 border-t space-y-2">
                      {secondaryColumns.map((column) => (
                        <div key={column.key} className="flex justify-between items-start">
                          <span className="text-sm font-medium text-muted-foreground">{column.label}:</span>
                          <span className="text-sm text-right flex-1 ml-2">
                            {column.render ? column.render(row[column.key], row) : row[column.key]}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Row Actions */}
              {onRowClick && (
                <Button variant="outline" size="sm" className="w-full mt-3" onClick={() => onRowClick(row)}>
                  View Details
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // Desktop Table View
  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.key}>{column.label}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, index) => (
            <TableRow
              key={index}
              className={onRowClick ? "cursor-pointer hover:bg-muted/50" : ""}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((column) => (
                <TableCell key={column.key}>
                  {column.render ? column.render(row[column.key], row) : row[column.key]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
