"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { PriceMatchUI } from "./price-match-ui"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Calculator, Edit, FileText } from "lucide-react"
import type { Project, MatchedItem } from "@/lib/models"

interface ProjectQuotationProps {
  project: Project
  onQuotationSaved?: () => void
}

export function ProjectQuotation({ project, onQuotationSaved }: ProjectQuotationProps) {
  const { toast } = useToast()
  const [quotation, setQuotation] = useState<any>(null)
  const [showMatchingDialog, setShowMatchingDialog] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchQuotation()
  }, [project.id])

  const fetchQuotation = async () => {
    try {
      const response = await fetch(`/api/projects/${project.id}/quotation`)
      if (response.ok) {
        const data = await response.json()
        setQuotation(data.quotation)
      }
    } catch (error) {
      console.error("Failed to fetch quotation:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleMatchingComplete = async (results: MatchedItem[]) => {
    try {
      const response = await fetch(`/api/projects/${project.id}/quotation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: results,
          total: results.reduce((sum, item) => sum + item.boqQty * item.matchedRate, 0),
        }),
      })

      if (response.ok) {
        toast({
          title: "Quotation Created",
          description: "Price matching results saved as quotation",
        })
        setShowMatchingDialog(false)
        fetchQuotation()
        onQuotationSaved?.()
      } else {
        toast({
          title: "Error",
          description: "Failed to save quotation",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not save quotation",
        variant: "destructive",
      })
    }
  }

  const exportQuotation = async () => {
    try {
      const response = await fetch(`/api/projects/${project.id}/quotation/export`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `quotation-${project.name}-${new Date().toISOString().split("T")[0]}.xlsx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        toast({
          title: "Export Successful",
          description: "Quotation exported successfully",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export quotation",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading quotation...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Project Quotation
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {project.name} - {project.clientName}
              </p>
            </div>
            <div className="flex gap-2">
              {quotation ? (
                <>
                  <Button variant="outline" onClick={() => setShowMatchingDialog(true)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Matching
                  </Button>
                  <Button variant="outline" onClick={exportQuotation}>
                    <FileText className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => setShowMatchingDialog(true)}
                  className="bg-brand-DEFAULT hover:bg-brand-dark text-brand-foreground"
                >
                  <Calculator className="mr-2 h-4 w-4" />
                  Start Price Matching
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        {quotation && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-brand-DEFAULT">{quotation.items?.length || 0}</div>
                <div className="text-sm text-muted-foreground">Items Matched</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">${quotation.total?.toLocaleString() || 0}</div>
                <div className="text-sm text-muted-foreground">Total Value</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{quotation.averageConfidence?.toFixed(1) || 0}%</div>
                <div className="text-sm text-muted-foreground">Avg Confidence</div>
              </div>
            </div>

            {quotation.items && quotation.items.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold">Matched Items Summary</h4>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {quotation.items.slice(0, 10).map((item: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                      <div className="flex-1">
                        <div className="text-sm font-medium truncate">{item.boqDescription}</div>
                        <div className="text-xs text-muted-foreground truncate">→ {item.matchedItemDescription}</div>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-sm font-medium">${(item.boqQty * item.matchedRate).toLocaleString()}</div>
                        <Badge variant={item.confidence >= 80 ? "default" : "secondary"} className="text-xs">
                          {item.confidence}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {quotation.items.length > 10 && (
                    <div className="text-center text-sm text-muted-foreground">
                      ... and {quotation.items.length - 10} more items
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Price Matching Dialog */}
      <Dialog open={showMatchingDialog} onOpenChange={setShowMatchingDialog}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {quotation ? "Edit Price Matching" : "Price Matching"} - {project.name}
            </DialogTitle>
          </DialogHeader>
          <PriceMatchUI
            project={project}
            existingQuotation={quotation}
            onComplete={handleMatchingComplete}
            onCancel={() => setShowMatchingDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
