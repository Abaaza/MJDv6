"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Filter, ArrowUpDown } from "lucide-react"
import type { PriceItem } from "@/lib/models"

interface ManualSearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (item: PriceItem) => void
  priceList: PriceItem[]
  currentDescription: string
}

type SortField = "description" | "rate" | "category" | "unit"
type SortDirection = "asc" | "desc"

export function ManualSearchDialog({
  open,
  onOpenChange,
  onSelect,
  priceList,
  currentDescription,
}: ManualSearchDialogProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [sortField, setSortField] = useState<SortField>("description")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Reset search when dialog opens
  useEffect(() => {
    if (open) {
      setSearchTerm("")
      setCategoryFilter("")
      setSelectedIndex(0)
      // Pre-populate search with key terms from current description
      if (currentDescription) {
        const keyTerms = extractKeyTerms(currentDescription)
        setSearchTerm(keyTerms.slice(0, 3).join(" "))
      }
    }
  }, [open, currentDescription])

  // Extract key terms from description for better initial search
  const extractKeyTerms = (description: string): string[] => {
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
      "mm",
      "cm",
      "m",
      "inch",
      "in",
      "ft",
    ])

    return description
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2 && !stopWords.has(word))
      .slice(0, 5) // Take top 5 meaningful words
  }

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(priceList.map((item) => item.category).filter(Boolean))
    return Array.from(cats).sort()
  }, [priceList])

  // Filter and sort items
  const filteredItems = useMemo(() => {
    const filtered = priceList.filter((item) => {
      const matchesSearch =
        !searchTerm ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.fullContext?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesCategory = !categoryFilter || item.category === categoryFilter

      return matchesSearch && matchesCategory && item.rate != null
    })

    // Sort items
    filtered.sort((a, b) => {
      let aVal: any
      let bVal: any

      switch (sortField) {
        case "description":
          aVal = a.description.toLowerCase()
          bVal = b.description.toLowerCase()
          break
        case "rate":
          aVal = a.rate || 0
          bVal = b.rate || 0
          break
        case "category":
          aVal = a.category?.toLowerCase() || ""
          bVal = b.category?.toLowerCase() || ""
          break
        case "unit":
          aVal = a.unit?.toLowerCase() || ""
          bVal = b.unit?.toLowerCase() || ""
          break
        default:
          return 0
      }

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1
      return 0
    })

    return filtered
  }, [priceList, searchTerm, categoryFilter, sortField, sortDirection])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const handleSelect = (item: PriceItem) => {
    onSelect(item)
    onOpenChange(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((prev) => Math.min(prev + 1, filteredItems.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (filteredItems[selectedIndex]) {
        handleSelect(filteredItems[selectedIndex])
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]" onKeyDown={handleKeyDown}>
        <DialogHeader>
          <DialogTitle>Manual Price Search</DialogTitle>
          <div className="text-sm text-muted-foreground">
            Searching for: <span className="font-medium">{currentDescription}</span>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Controls */}
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search descriptions, categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  autoFocus
                />
              </div>
            </div>
            <div className="w-48">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Results Count */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {filteredItems.length} items found
              {searchTerm && (
                <Button variant="ghost" size="sm" onClick={() => setSearchTerm("")} className="ml-2 h-6 px-2 text-xs">
                  Clear search
                </Button>
              )}
            </div>
            <div className="text-xs text-muted-foreground">Use ↑↓ arrows and Enter to select</div>
          </div>

          {/* Results Table */}
          <ScrollArea className="h-96 border rounded-md">
            <Table>
              <TableHeader className="sticky top-0 bg-background">
                <TableRow>
                  <TableHead className="w-[50%]">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("description")}
                      className="h-8 px-2 font-medium"
                    >
                      Description
                      <ArrowUpDown className="ml-1 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead className="w-[15%]">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("category")}
                      className="h-8 px-2 font-medium"
                    >
                      Category
                      <ArrowUpDown className="ml-1 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead className="w-[10%]">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("unit")}
                      className="h-8 px-2 font-medium"
                    >
                      Unit
                      <ArrowUpDown className="ml-1 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead className="w-[15%]">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("rate")}
                      className="h-8 px-2 font-medium"
                    >
                      Rate
                      <ArrowUpDown className="ml-1 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead className="w-[10%]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item, index) => (
                  <TableRow
                    key={item._id}
                    className={`cursor-pointer hover:bg-muted/50 ${index === selectedIndex ? "bg-muted" : ""}`}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <TableCell className="font-medium">
                      <div className="space-y-1">
                        <div className="text-sm">{item.description}</div>
                        {item.fullContext && item.fullContext !== item.description && (
                          <div className="text-xs text-muted-foreground line-clamp-2">{item.fullContext}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.category && (
                        <Badge variant="secondary" className="text-xs">
                          {item.category}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{item.unit || "-"}</TableCell>
                    <TableCell className="font-medium">${item.rate?.toLocaleString() || "0"}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" className="h-7 px-2 text-xs">
                        Select
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>

          {filteredItems.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Filter className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <div className="text-lg font-medium">No items found</div>
              <div className="text-sm">Try adjusting your search terms or category filter</div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
