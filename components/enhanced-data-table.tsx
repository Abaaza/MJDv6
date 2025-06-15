"use client"

import type React from "react"

import { useState, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Search, ArrowUpDown, ArrowUp, ArrowDown, MoreHorizontal, Download, Eye, EyeOff, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

interface Column<T> {
  key: keyof T | string
  label: string
  sortable?: boolean
  filterable?: boolean
  render?: (value: any, item: T) => React.ReactNode
  width?: string
  align?: "left" | "center" | "right"
  hidden?: boolean
}

interface EnhancedDataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  title?: string
  description?: string
  searchable?: boolean
  filterable?: boolean
  selectable?: boolean
  exportable?: boolean
  refreshable?: boolean
  onRefresh?: () => void
  onRowClick?: (item: T) => void
  onSelectionChange?: (selectedItems: T[]) => void
  onExport?: (data: T[]) => void
  loading?: boolean
  emptyMessage?: string
  pageSize?: number
}

export function EnhancedDataTable<T extends Record<string, any>>({
  data,
  columns,
  title,
  description,
  searchable = true,
  filterable = true,
  selectable = false,
  exportable = false,
  refreshable = false,
  onRefresh,
  onRowClick,
  onSelectionChange,
  onExport,
  loading = false,
  emptyMessage = "No data available",
  pageSize = 10,
}: EnhancedDataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null)
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [selectedItems, setSelectedItems] = useState<T[]>([])
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)

  const visibleColumns = columns.filter((col) => !hiddenColumns.includes(col.key as string))

  const filteredAndSortedData = useMemo(() => {
    let result = [...data]

    // Apply search
    if (searchTerm) {
      result = result.filter((item) =>
        Object.values(item).some((value) => String(value).toLowerCase().includes(searchTerm.toLowerCase())),
      )
    }

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        result = result.filter((item) => String(item[key]).toLowerCase().includes(value.toLowerCase()))
      }
    })

    // Apply sorting
    if (sortConfig) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key]
        const bValue = b[sortConfig.key]

        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1
        return 0
      })
    }

    return result
  }, [data, searchTerm, filters, sortConfig])

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredAndSortedData.slice(startIndex, startIndex + pageSize)
  }, [filteredAndSortedData, currentPage, pageSize])

  const totalPages = Math.ceil(filteredAndSortedData.length / pageSize)

  const handleSort = (key: string) => {
    setSortConfig((current) => {
      if (current?.key === key) {
        return current.direction === "asc" ? { key, direction: "desc" } : null
      }
      return { key, direction: "asc" }
    })
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(paginatedData)
    } else {
      setSelectedItems([])
    }
    onSelectionChange?.(checked ? paginatedData : [])
  }

  const handleSelectItem = (item: T, checked: boolean) => {
    const newSelection = checked ? [...selectedItems, item] : selectedItems.filter((selected) => selected !== item)

    setSelectedItems(newSelection)
    onSelectionChange?.(newSelection)
  }

  const getSortIcon = (columnKey: string) => {
    if (sortConfig?.key !== columnKey) {
      return <ArrowUpDown className="h-4 w-4 opacity-50" />
    }
    return sortConfig.direction === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
  }

  const toggleColumnVisibility = (columnKey: string) => {
    setHiddenColumns((prev) =>
      prev.includes(columnKey) ? prev.filter((key) => key !== columnKey) : [...prev, columnKey],
    )
  }

  if (loading) {
    return (
      <Card className="card-shadow-lg">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="loading-shimmer h-8 rounded w-1/3"></div>
            <div className="loading-shimmer h-4 rounded w-1/2"></div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="loading-shimmer h-12 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="card-shadow-lg animate-fade-in">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            {title && <CardTitle className="text-xl font-bold">{title}</CardTitle>}
            {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
          </div>
          <div className="flex items-center gap-2">
            {refreshable && (
              <Button variant="outline" size="sm" onClick={onRefresh} className="btn-secondary">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            )}
            {exportable && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onExport?.(filteredAndSortedData)}
                className="btn-secondary"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="btn-secondary">
                  <Eye className="h-4 w-4 mr-2" />
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 shadow-xl">
                {columns.map((column) => (
                  <DropdownMenuItem
                    key={column.key as string}
                    onClick={() => toggleColumnVisibility(column.key as string)}
                    className="flex items-center gap-2"
                  >
                    {hiddenColumns.includes(column.key as string) ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                    {column.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          {searchable && (
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 form-input"
              />
            </div>
          )}

          {filterable && (
            <div className="flex gap-2">
              {columns
                .filter((col) => col.filterable)
                .map((column) => (
                  <Select
                    key={column.key as string}
                    value={filters[column.key as string] || ""}
                    onValueChange={(value) => setFilters((prev) => ({ ...prev, [column.key as string]: value }))}
                  >
                    <SelectTrigger className="w-40 form-input">
                      <SelectValue placeholder={`Filter ${column.label}`} />
                    </SelectTrigger>
                    <SelectContent className="shadow-xl">
                      <SelectItem value="all">All {column.label}</SelectItem>
                      {Array.from(new Set(data.map((item) => String(item[column.key as string]))))
                        .filter(Boolean)
                        .map((value) => (
                          <SelectItem key={value} value={value}>
                            {value}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                ))}
            </div>
          )}
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {paginatedData.length} of {filteredAndSortedData.length} results
            {selectedItems.length > 0 && ` (${selectedItems.length} selected)`}
          </span>
          {filteredAndSortedData.length !== data.length && (
            <Badge variant="secondary">Filtered from {data.length} total</Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {selectable && (
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedItems.length === paginatedData.length && paginatedData.length > 0}
                      onCheckedChange={handleSelectAll}
                      className="focus-ring"
                    />
                  </TableHead>
                )}
                {visibleColumns.map((column) => (
                  <TableHead
                    key={column.key as string}
                    className={cn(
                      "font-semibold",
                      column.align === "center" && "text-center",
                      column.align === "right" && "text-right",
                      column.width && `w-${column.width}`,
                    )}
                  >
                    {column.sortable ? (
                      <Button
                        variant="ghost"
                        onClick={() => handleSort(column.key as string)}
                        className="h-auto p-0 font-semibold hover:bg-transparent focus-ring"
                      >
                        {column.label}
                        {getSortIcon(column.key as string)}
                      </Button>
                    ) : (
                      column.label
                    )}
                  </TableHead>
                ))}
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={visibleColumns.length + (selectable ? 1 : 0) + 1}
                    className="text-center py-8 text-muted-foreground"
                  >
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((item, index) => (
                  <TableRow
                    key={index}
                    className={cn("table-row-hover cursor-pointer", selectedItems.includes(item) && "bg-blue-50")}
                    onClick={() => onRowClick?.(item)}
                  >
                    {selectable && (
                      <TableCell>
                        <Checkbox
                          checked={selectedItems.includes(item)}
                          onCheckedChange={(checked) => handleSelectItem(item, checked as boolean)}
                          onClick={(e) => e.stopPropagation()}
                          className="focus-ring"
                        />
                      </TableCell>
                    )}
                    {visibleColumns.map((column) => (
                      <TableCell
                        key={column.key as string}
                        className={cn(
                          column.align === "center" && "text-center",
                          column.align === "right" && "text-right",
                        )}
                      >
                        {column.render
                          ? column.render(item[column.key as string], item)
                          : String(item[column.key as string] || "-")}
                      </TableCell>
                    ))}
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => e.stopPropagation()}
                            className="h-8 w-8 p-0 hover:bg-gray-100"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="shadow-xl">
                          <DropdownMenuItem onClick={() => onRowClick?.(item)}>View Details</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t">
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="btn-secondary"
              >
                Previous
              </Button>
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const pageNum = i + 1
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className={currentPage === pageNum ? "btn-primary" : "btn-secondary"}
                  >
                    {pageNum}
                  </Button>
                )
              })}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="btn-secondary"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
