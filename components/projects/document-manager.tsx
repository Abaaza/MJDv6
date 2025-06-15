"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { FileText, Trash2, Download } from "lucide-react"
import type { Project } from "@/lib/models"

interface DocumentManagerProps {
  project: Project
  onDocumentUploaded: () => void
  onClose: () => void
}

export function DocumentManager({ project, onDocumentUploaded, onClose }: DocumentManagerProps) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [documentType, setDocumentType] = useState("general")

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("type", documentType)

      const response = await fetch(`/api/projects/${project.id}/documents`, {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Document uploaded successfully",
        })
        onDocumentUploaded()
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
      } else {
        const data = await response.json()
        toast({
          title: "Upload Failed",
          description: data.message || "Failed to upload document",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not connect to server",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return

    try {
      const response = await fetch(`/api/projects/${project.id}/documents/${documentId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Document deleted successfully",
        })
        onDocumentUploaded() // Refresh the project data
      } else {
        const data = await response.json()
        toast({
          title: "Delete Failed",
          description: data.message || "Failed to delete document",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not connect to server",
        variant: "destructive",
      })
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload New Document</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="documentType">Document Type</Label>
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="boq">Bill of Quantities (BoQ)</SelectItem>
                  <SelectItem value="drawing">Drawing/Plan</SelectItem>
                  <SelectItem value="specification">Specification</SelectItem>
                  <SelectItem value="contract">Contract Document</SelectItem>
                  <SelectItem value="general">General Document</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">Select File</Label>
              <Input
                ref={fileInputRef}
                type="file"
                onChange={handleFileUpload}
                disabled={uploading}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.dwg"
              />
            </div>

            {uploading && <p className="text-sm text-muted-foreground">Uploading...</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Project Documents</CardTitle>
        </CardHeader>
        <CardContent>
          {project.documents && project.documents.length > 0 ? (
            <div className="space-y-2">
              {project.documents.map((doc: any) => (
                <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{doc.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {doc.type} • {formatFileSize(doc.size)} • {new Date(doc.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => window.open(doc.url, "_blank")}>
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDeleteDocument(doc.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">No documents uploaded yet.</p>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={onClose}>Close</Button>
      </div>
    </div>
  )
}
