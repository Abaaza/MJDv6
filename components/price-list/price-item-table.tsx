"use client"

import type React from "react"
import { useState, useEffect } from "react"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit, Trash2, ArrowUpDown } from "lucide-react"
import type { PriceItem } from "@/lib/models"

interface PriceItemTableProps {
  items: PriceItem[]
  onEdit: (item: PriceItem) => void
  onDelete: (itemId: string) => void
  onSort: (field: string) => void
  sortBy: string
  sortOrder: "asc" | "desc"
}

// Simple currency formatting without server dependencies
const getCurrencySymbol = (currency: string): string => {
  const symbols: Record<string, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    CAD: "C$",
    AUD: "A$",
    JPY: "¥",
    CHF: "CHF",
    CNY: "¥",
    INR: "₹",
    AED: "د.إ",
    SAR: "﷼",
  }
  return symbols[currency] || "$"
}

const formatCurrency = (amount: number, currency: string): string => {
  const symbol = getCurrencySymbol(currency)

  // Simple number formatting
  const formatted = amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  return `${symbol}${formatted}`
}

export function PriceItemTable({ items, onEdit, onDelete, onSort, sortBy, sortOrder }: PriceItemTableProps) {
  const [currency, setCurrency] = useState("USD")

  // Fetch current currency setting
  useEffect(() => {
    const fetchCurrency = async () => {
      try {
        console.log("💰 Fetching current currency setting...")
        const response = await fetch("/api/admin/settings")
        if (response.ok) {
          const settings = await response.json()
          const currentCurrency = settings.currency || "USD"
          console.log("✅ Currency setting loaded:", currentCurrency)
          setCurrency(currentCurrency)
        } else {
          console.log("⚠️ Failed to fetch currency, using USD")
          setCurrency("USD")
        }
      } catch (error) {
        console.error("❌ Error fetching currency:", error)
        setCurrency("USD")
      }
    }

    fetchCurrency()
  }, [])

  const formatPrice = (amount?: number) => {
    if (amount === undefined || amount === null) return "-"
    return formatCurrency(amount, currency)
  }

  const SortableHeader = ({ field, children }: { field: string; children: React.ReactNode }) => (
    <TableHead>
      <Button variant="ghost" onClick={() => onSort(field)} className="h-auto p-0 font-semibold hover:bg-transparent">
        {children}
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    </TableHead>
  )

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No price items found. Add your first item to get started.</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <SortableHeader field="code">Code</SortableHeader>
            <SortableHeader field="description">Description</SortableHeader>
            <SortableHeader field="category">Category</SortableHeader>
            <SortableHeader field="subCategory">Sub Category</SortableHeader>
            <SortableHeader field="unit">Unit</SortableHeader>
            <SortableHeader field="rate">Rate ({getCurrencySymbol(currency)})</SortableHeader>
            <TableHead>Keywords</TableHead>
            <TableHead className="w-[50px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item._id || item.id}>
              <TableCell className="font-mono font-medium">{item.code || "-"}</TableCell>
              <TableCell className="max-w-xs truncate" title={item.description}>
                {item.description}
              </TableCell>
              <TableCell>{item.category || "-"}</TableCell>
              <TableCell>{item.subCategory || "-"}</TableCell>
              <TableCell>{item.unit || "-"}</TableCell>
              <TableCell className="font-medium">{formatPrice(item.rate)}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1 max-w-32">
                  {item.keywords?.slice(0, 2).map((keyword, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {keyword}
                    </Badge>
                  ))}
                  {(item.keywords?.length || 0) > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{(item.keywords?.length || 0) - 2}
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(item)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDelete(item._id || item.id || "")} className="text-red-600">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
