"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import type { PriceItem } from "@/lib/models"

interface PriceItemFormProps {
  item?: PriceItem
  onSubmit: (itemData: Partial<PriceItem>) => void
  onCancel: () => void
  isLoading?: boolean
}

export function PriceItemForm({ item, onSubmit, onCancel, isLoading = false }: PriceItemFormProps) {
  const [formData, setFormData] = useState({
    code: item?.code || "",
    ref: item?.ref || "",
    description: item?.description || "",
    category: item?.category || "",
    subCategory: item?.subCategory || "",
    unit: item?.unit || "",
    rate: item?.rate?.toString() || "",
    keywords: item?.keywords || [],
    phrases: item?.phrases || [],
  })

  const [newKeyword, setNewKeyword] = useState("")
  const [newPhrase, setNewPhrase] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      rate: formData.rate ? Number.parseFloat(formData.rate) : undefined,
    })
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const addKeyword = () => {
    if (newKeyword.trim() && !formData.keywords.includes(newKeyword.trim())) {
      setFormData((prev) => ({
        ...prev,
        keywords: [...prev.keywords, newKeyword.trim()],
      }))
      setNewKeyword("")
    }
  }

  const removeKeyword = (keyword: string) => {
    setFormData((prev) => ({
      ...prev,
      keywords: prev.keywords.filter((k) => k !== keyword),
    }))
  }

  const addPhrase = () => {
    if (newPhrase.trim() && !formData.phrases.includes(newPhrase.trim())) {
      setFormData((prev) => ({
        ...prev,
        phrases: [...prev.phrases, newPhrase.trim()],
      }))
      setNewPhrase("")
    }
  }

  const removePhrase = (phrase: string) => {
    setFormData((prev) => ({
      ...prev,
      phrases: prev.phrases.filter((p) => p !== phrase),
    }))
  }

  const handleKeywordKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addKeyword()
    }
  }

  const handlePhraseKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addPhrase()
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{item ? "Edit Price Item" : "Add New Price Item"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Item Code</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => handleInputChange("code", e.target.value.toUpperCase())}
                placeholder="e.g., EXC001"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ref">Reference</Label>
              <Input
                id="ref"
                value={formData.ref}
                onChange={(e) => handleInputChange("ref", e.target.value)}
                placeholder="e.g., REF001"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Detailed description of the item..."
              rows={3}
              required
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => handleInputChange("category", e.target.value)}
                placeholder="e.g., Excavation"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subCategory">Sub Category</Label>
              <Input
                id="subCategory"
                value={formData.subCategory}
                onChange={(e) => handleInputChange("subCategory", e.target.value)}
                placeholder="e.g., Bulk Excavation"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Input
                id="unit"
                value={formData.unit}
                onChange={(e) => handleInputChange("unit", e.target.value)}
                placeholder="e.g., m3, m2, kg"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rate">Rate</Label>
              <Input
                id="rate"
                type="number"
                step="0.01"
                min="0"
                value={formData.rate}
                onChange={(e) => handleInputChange("rate", e.target.value)}
                placeholder="0.00"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Keywords Section */}
          <div className="space-y-2">
            <Label>Keywords</Label>
            <div className="flex gap-2">
              <Input
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyPress={handleKeywordKeyPress}
                placeholder="Add keyword and press Enter"
                disabled={isLoading}
              />
              <Button type="button" onClick={addKeyword} disabled={isLoading || !newKeyword.trim()}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.keywords.map((keyword, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {keyword}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => removeKeyword(keyword)} />
                </Badge>
              ))}
            </div>
          </div>

          {/* Phrases Section */}
          <div className="space-y-2">
            <Label>Phrases</Label>
            <div className="flex gap-2">
              <Input
                value={newPhrase}
                onChange={(e) => setNewPhrase(e.target.value)}
                onKeyPress={handlePhraseKeyPress}
                placeholder="Add phrase and press Enter"
                disabled={isLoading}
              />
              <Button type="button" onClick={addPhrase} disabled={isLoading || !newPhrase.trim()}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.phrases.map((phrase, index) => (
                <Badge key={index} variant="outline" className="flex items-center gap-1">
                  {phrase}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => removePhrase(phrase)} />
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-brand-DEFAULT hover:bg-brand-dark text-brand-foreground"
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : item ? "Update Item" : "Create Item"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
