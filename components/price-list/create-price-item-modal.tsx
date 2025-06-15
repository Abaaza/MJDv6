"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"

interface CreatePriceItemModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function CreatePriceItemModal({ isOpen, onClose, onSuccess }: CreatePriceItemModalProps) {
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    category: "",
    subCategory: "",
    unit: "",
    rate: "",
    keywords: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const categories = [
    "Demolition",
    "Excavation",
    "Concrete",
    "Masonry",
    "Steel",
    "Carpentry",
    "Roofing",
    "Plumbing",
    "Electrical",
    "Finishing",
  ]

  const units = ["m", "m2", "m3", "kg", "ton", "pcs", "lot", "ls", "hr", "day"]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      console.log("🔍 Creating new price item:", formData)

      const response = await fetch("/api/price-items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          rate: Number.parseFloat(formData.rate),
          keywords: formData.keywords
            .split(",")
            .map((k) => k.trim())
            .filter((k) => k),
          phrases: [formData.description],
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      console.log("✅ Price item created successfully:", result)

      // Reset form
      setFormData({
        code: "",
        description: "",
        category: "",
        subCategory: "",
        unit: "",
        rate: "",
        keywords: "",
      })

      onSuccess()
      onClose()
    } catch (error) {
      console.error("❌ Error creating price item:", error)
      setError(error instanceof Error ? error.message : "Failed to create price item")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const isFormValid = formData.code && formData.description && formData.rate && !isNaN(Number.parseFloat(formData.rate))

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Price Item</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="code">Code *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => handleInputChange("code", e.target.value)}
                placeholder="e.g., DEMO-BRICK-001"
                required
              />
            </div>

            <div>
              <Label htmlFor="rate">Rate *</Label>
              <Input
                id="rate"
                type="number"
                step="0.01"
                value={formData.rate}
                onChange={(e) => handleInputChange("rate", e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Detailed description of the work item"
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="subCategory">Sub Category</Label>
              <Input
                id="subCategory"
                value={formData.subCategory}
                onChange={(e) => handleInputChange("subCategory", e.target.value)}
                placeholder="e.g., Internal Demolition"
              />
            </div>

            <div>
              <Label htmlFor="unit">Unit</Label>
              <Select value={formData.unit} onValueChange={(value) => handleInputChange("unit", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="keywords">Keywords</Label>
            <Input
              id="keywords"
              value={formData.keywords}
              onChange={(e) => handleInputChange("keywords", e.target.value)}
              placeholder="demolish, brick, block, wall (comma separated)"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isFormValid || isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Item"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default CreatePriceItemModal
