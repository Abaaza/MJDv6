"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { X, Loader2 } from "lucide-react"
import type { PriceItem } from "@/lib/models"

interface EditPriceItemModalProps {
  item: PriceItem | null
  isOpen: boolean
  onClose: () => void
  onSave: (item: PriceItem) => void
}

export function EditPriceItemModal({ item, isOpen, onClose, onSave }: EditPriceItemModalProps) {
  const [formData, setFormData] = useState<Partial<PriceItem>>({})
  const [keywordInput, setKeywordInput] = useState("")
  const [phraseInput, setPhraseInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Initialize form data when item changes
  useEffect(() => {
    if (item) {
      console.log("🔧 Initializing edit form with item:", item)
      setFormData({
        ...item,
        keywords: item.keywords || [],
        phrases: item.phrases || [],
      })
    }
  }, [item])

  const handleSave = async () => {
    if (!item || !formData.description) {
      console.log("❌ Cannot save - missing item or description")
      return
    }

    setIsLoading(true)
    console.log("💾 Saving item:", item.id, formData)

    try {
      const response = await fetch(`/api/price-items/${item.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()
      console.log("💾 Save response:", response.status, result)

      if (response.ok && result.success) {
        console.log("✅ Item saved successfully")
        onSave(result.item)
        onClose()
      } else {
        console.error("❌ Failed to save item:", result)
        alert(`Failed to save: ${result.error || result.message || "Unknown error"}`)
      }
    } catch (error) {
      console.error("❌ Save error:", error)
      alert("Error saving item. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const addKeyword = () => {
    if (keywordInput.trim() && !formData.keywords?.includes(keywordInput.trim())) {
      setFormData({
        ...formData,
        keywords: [...(formData.keywords || []), keywordInput.trim()],
      })
      setKeywordInput("")
    }
  }

  const removeKeyword = (keyword: string) => {
    setFormData({
      ...formData,
      keywords: formData.keywords?.filter((k) => k !== keyword) || [],
    })
  }

  const addPhrase = () => {
    if (phraseInput.trim() && !formData.phrases?.includes(phraseInput.trim())) {
      setFormData({
        ...formData,
        phrases: [...(formData.phrases || []), phraseInput.trim()],
      })
      setPhraseInput("")
    }
  }

  const removePhrase = (phrase: string) => {
    setFormData({
      ...formData,
      phrases: formData.phrases?.filter((p) => p !== phrase) || [],
    })
  }

  if (!item) {
    console.log("⚠️ Edit modal - no item provided")
    return null
  }

  console.log("🔧 Rendering edit modal for item:", item.id, "isOpen:", isOpen)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Price Item</DialogTitle>
          <DialogDescription>
            Update the price item details below. All fields are optional except description.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                value={formData.code || ""}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g., A001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ref">Reference</Label>
              <Input
                id="ref"
                value={formData.ref || ""}
                onChange={(e) => setFormData({ ...formData, ref: e.target.value })}
                placeholder="e.g., REF-001"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description || ""}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter item description..."
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={formData.category || ""}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g., Construction"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subCategory">Sub Category</Label>
              <Input
                id="subCategory"
                value={formData.subCategory || ""}
                onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                placeholder="e.g., Concrete Work"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Input
                id="unit"
                value={formData.unit || ""}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                placeholder="e.g., m3, kg, pcs"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rate">Rate</Label>
              <Input
                id="rate"
                type="number"
                step="0.01"
                value={formData.rate || ""}
                onChange={(e) => setFormData({ ...formData, rate: Number.parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Keywords</Label>
            <div className="flex gap-2">
              <Input
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                placeholder="Add keyword..."
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addKeyword())}
              />
              <Button type="button" onClick={addKeyword} variant="outline">
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.keywords?.map((keyword) => (
                <Badge key={keyword} variant="secondary" className="flex items-center gap-1">
                  {keyword}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => removeKeyword(keyword)} />
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Phrases</Label>
            <div className="flex gap-2">
              <Input
                value={phraseInput}
                onChange={(e) => setPhraseInput(e.target.value)}
                placeholder="Add phrase..."
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addPhrase())}
              />
              <Button type="button" onClick={addPhrase} variant="outline">
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.phrases?.map((phrase) => (
                <Badge key={phrase} variant="secondary" className="flex items-center gap-1">
                  {phrase}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => removePhrase(phrase)} />
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!formData.description || isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
