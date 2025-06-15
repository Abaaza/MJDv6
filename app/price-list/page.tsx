"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { DollarSign, Plus, Search, Upload, Download, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import { PriceItemTable } from "@/components/price-list/price-item-table"
import { CreatePriceItemModal } from "@/components/price-list/create-price-item-modal"
import { EditPriceItemModal } from "@/components/price-list/edit-price-item-modal"
import type { PriceItem } from "@/lib/models"

export default function PriceListPage() {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [items, setItems] = useState<PriceItem[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [subCategories, setSubCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [subCategoryFilter, setSubCategoryFilter] = useState("all")
  const [minRate, setMinRate] = useState("")
  const [maxRate, setMaxRate] = useState("")
  const [sortBy, setSortBy] = useState("createdAt")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingItem, setEditingItem] = useState<PriceItem | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [importLoading, setImportLoading] = useState(false)

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  // Fetch price items
  const fetchItems = async () => {
    setLoading(true)
    try {
      console.log("🔍 Fetching price items...")
      const params = new URLSearchParams()
      if (searchTerm) params.append("search", searchTerm)
      if (categoryFilter && categoryFilter !== "all") params.append("category", categoryFilter)
      if (subCategoryFilter && subCategoryFilter !== "all") params.append("subCategory", subCategoryFilter)
      if (minRate) params.append("minRate", minRate)
      if (maxRate) params.append("maxRate", maxRate)
      params.append("sortBy", sortBy)
      params.append("sortOrder", sortOrder)
      params.append("page", currentPage.toString())
      params.append("limit", itemsPerPage.toString())

      const response = await fetch(`/api/price-items?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        console.log("✅ Price items fetched:", data.items?.length || 0)
        console.log("📊 Pagination info:", { total: data.total, page: data.page, totalPages: data.totalPages })

        setItems(data.items || [])
        setCategories(data.categories || [])
        setSubCategories(data.subCategories || [])
        setTotalItems(data.total || 0)
        setTotalPages(data.totalPages || 0)
      } else {
        console.error("❌ Failed to fetch price items:", response.status)
        toast({
          title: "Error",
          description: "Failed to fetch price items",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("❌ Error fetching price items:", error)
      toast({
        title: "Error",
        description: "Could not connect to server",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()
  }, [searchTerm, categoryFilter, subCategoryFilter, minRate, maxRate, sortBy, sortOrder, currentPage, itemsPerPage])

  // Reset to page 1 when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1)
    }
  }, [searchTerm, categoryFilter, subCategoryFilter, minRate, maxRate, itemsPerPage])

  const handleCreateSuccess = () => {
    console.log("✅ Item created, refreshing list")
    setShowCreateModal(false)
    fetchItems()
  }

  const handleEditItem = (item: PriceItem) => {
    console.log("📝 Opening edit modal for item:", item.id)
    setEditingItem(item)
    setShowEditModal(true)
  }

  const handleEditSuccess = (updatedItem: PriceItem) => {
    console.log("✅ Item updated, refreshing list")
    setShowEditModal(false)
    setEditingItem(null)
    fetchItems()
  }

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this price item?")) return

    try {
      console.log("🗑️ Deleting item:", itemId)
      const response = await fetch(`/api/price-items/${itemId}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (response.ok && result.success) {
        console.log("✅ Item deleted successfully")
        toast({
          title: "Success",
          description: "Price item deleted successfully",
        })
        fetchItems()
      } else {
        console.error("❌ Failed to delete item:", result.message)
        toast({
          title: "Error",
          description: result.message || "Failed to delete price item",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("❌ Error deleting item:", error)
      toast({
        title: "Error",
        description: "Could not connect to server",
        variant: "destructive",
      })
    }
  }

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(field)
      setSortOrder("asc")
    }
  }

  const clearFilters = () => {
    setSearchTerm("")
    setCategoryFilter("all")
    setSubCategoryFilter("all")
    setMinRate("")
    setMaxRate("")
    setCurrentPage(1)
  }

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImportLoading(true)
    const formData = new FormData()
    formData.append("file", file)

    try {
      console.log("📤 Importing file:", file.name)
      const response = await fetch("/api/price-items/import", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Import Successful",
          description: `${data.imported || 0} items imported successfully. ${data.errors || 0} errors.`,
        })
        fetchItems()
      } else {
        toast({
          title: "Import Failed",
          description: data.message || "Failed to import price items",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("❌ Import error:", error)
      toast({
        title: "Error",
        description: "Could not connect to server",
        variant: "destructive",
      })
    } finally {
      setImportLoading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleExportItems = async () => {
    try {
      console.log("📤 Exporting price items...")
      const response = await fetch("/api/price-items/export")
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `price-list-${new Date().toISOString().split("T")[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        toast({
          title: "Export Successful",
          description: "Price list exported successfully",
        })
      } else {
        toast({
          title: "Export Failed",
          description: "Failed to export price items",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("❌ Export error:", error)
      toast({
        title: "Error",
        description: "Could not connect to server",
        variant: "destructive",
      })
    }
  }

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number.parseInt(value))
    setCurrentPage(1) // Reset to first page
  }

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = []
    const maxVisiblePages = 5
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }
    return pages
  }

  return (
    <div className="container mx-auto py-4 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-6 w-6 text-brand-DEFAULT" />
              <div>
                <CardTitle>Price List Management</CardTitle>
                <CardDescription>
                  Maintain your master list of construction items and rates.
                  {totalItems > 0 && (
                    <span className="ml-2 font-medium">
                      Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, totalItems)}{" "}
                      of {totalItems.toLocaleString()} items
                    </span>
                  )}
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleImportFile}
                className="hidden"
              />
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={importLoading}>
                {importLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                Import
              </Button>
              <Button variant="outline" onClick={handleExportItems}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-brand-DEFAULT hover:bg-brand-dark text-brand-foreground"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filter Controls */}
          <div className="space-y-4 mb-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by code, description, keywords, or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories
                    .filter((category) => category && category.trim())
                    .map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Select value={subCategoryFilter} onValueChange={setSubCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Sub Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sub Categories</SelectItem>
                  {subCategories
                    .filter((subCategory) => subCategory && subCategory.trim())
                    .map((subCategory) => (
                      <SelectItem key={subCategory} value={subCategory}>
                        {subCategory}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-4 items-end">
              <div className="space-y-2">
                <label className="text-sm font-medium">Min Rate</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={minRate}
                  onChange={(e) => setMinRate(e.target.value)}
                  className="w-32"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Max Rate</label>
                <Input
                  type="number"
                  placeholder="999.99"
                  value={maxRate}
                  onChange={(e) => setMaxRate(e.target.value)}
                  className="w-32"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Items per page</label>
                <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="20">20 items</SelectItem>
                    <SelectItem value="50">50 items</SelectItem>
                    <SelectItem value="100">100 items</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </div>

          {/* Price Items Table */}
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Loading price items...</p>
            </div>
          ) : (
            <>
              <PriceItemTable
                items={items}
                onEdit={handleEditItem}
                onDelete={handleDeleteItem}
                onSort={handleSort}
                sortBy={sortBy}
                sortOrder={sortOrder}
              />

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalItems)}{" "}
                    of {totalItems.toLocaleString()} results
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>

                    <div className="flex gap-1">
                      {getPageNumbers().map((page) => (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(page)}
                          className="w-10"
                        >
                          {page}
                        </Button>
                      ))}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Price Item Modal */}
      <CreatePriceItemModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* Edit Price Item Modal */}
      <EditPriceItemModal
        item={editingItem}
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setEditingItem(null)
        }}
        onSave={handleEditSuccess}
      />
    </div>
  )
}
