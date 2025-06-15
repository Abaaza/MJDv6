"use client"

import type React from "react"

import { useState, useCallback, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Upload,
  File,
  FileText,
  X,
  Check,
  AlertTriangle,
  Download,
  Eye,
  Trash2,
  RefreshCw,
  ImageIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface FileUploadItem {
  id: string
  file: File
  status: "pending" | "uploading" | "success" | "error"
  progress: number
  preview?: string
  error?: string
  url?: string
}

interface AdvancedFileUploadProps {
  accept?: string
  multiple?: boolean
  maxSize?: number // in MB
  maxFiles?: number
  onUpload?: (files: File[]) => Promise<void>
  onFileSelect?: (files: FileUploadItem[]) => void
  className?: string
  disabled?: boolean
  showPreview?: boolean
  allowedTypes?: string[]
}

export function AdvancedFileUpload({
  accept = "*/*",
  multiple = true,
  maxSize = 10,
  maxFiles = 5,
  onUpload,
  onFileSelect,
  className,
  disabled = false,
  showPreview = true,
  allowedTypes = [],
}: AdvancedFileUploadProps) {
  const [files, setFiles] = useState<FileUploadItem[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) return <ImageIcon className="h-8 w-8 text-blue-500" />
    if (file.type.includes("pdf")) return <FileText className="h-8 w-8 text-red-500" />
    if (file.type.includes("excel") || file.type.includes("spreadsheet"))
      return <FileText className="h-8 w-8 text-green-500" />
    return <File className="h-8 w-8 text-gray-500" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const validateFile = (file: File): string | null => {
    if (maxSize && file.size > maxSize * 1024 * 1024) {
      return `File size exceeds ${maxSize}MB limit`
    }

    if (allowedTypes.length > 0 && !allowedTypes.some((type) => file.type.includes(type))) {
      return `File type not allowed. Allowed types: ${allowedTypes.join(", ")}`
    }

    return null
  }

  const createFilePreview = (file: File): Promise<string | undefined> => {
    return new Promise((resolve) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target?.result as string)
        reader.readAsDataURL(file)
      } else {
        resolve(undefined)
      }
    })
  }

  const processFiles = useCallback(
    async (fileList: FileList) => {
      const newFiles: FileUploadItem[] = []

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i]
        const error = validateFile(file)

        if (files.length + newFiles.length >= maxFiles) {
          break
        }

        const preview = showPreview ? await createFilePreview(file) : undefined

        newFiles.push({
          id: Math.random().toString(36).substr(2, 9),
          file,
          status: error ? "error" : "pending",
          progress: 0,
          preview,
          error,
        })
      }

      setFiles((prev) => [...prev, ...newFiles])
      onFileSelect?.(newFiles)
    },
    [files.length, maxFiles, showPreview, onFileSelect],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)

      if (disabled) return

      const droppedFiles = e.dataTransfer.files
      if (droppedFiles.length > 0) {
        processFiles(droppedFiles)
      }
    },
    [disabled, processFiles],
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = e.target.files
      if (selectedFiles && selectedFiles.length > 0) {
        processFiles(selectedFiles)
      }
    },
    [processFiles],
  )

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== id))
  }

  const retryUpload = (id: string) => {
    setFiles((prev) => prev.map((file) => (file.id === id ? { ...file, status: "pending", error: undefined } : file)))
  }

  const uploadFiles = async () => {
    if (!onUpload) return

    setIsUploading(true)
    const pendingFiles = files.filter((f) => f.status === "pending")

    for (const fileItem of pendingFiles) {
      try {
        setFiles((prev) => prev.map((f) => (f.id === fileItem.id ? { ...f, status: "uploading", progress: 0 } : f)))

        // Simulate upload progress
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise((resolve) => setTimeout(resolve, 100))
          setFiles((prev) => prev.map((f) => (f.id === fileItem.id ? { ...f, progress } : f)))
        }

        await onUpload([fileItem.file])

        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileItem.id
              ? { ...f, status: "success", progress: 100, url: URL.createObjectURL(fileItem.file) }
              : f,
          ),
        )
      } catch (error) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileItem.id
              ? { ...f, status: "error", error: error instanceof Error ? error.message : "Upload failed" }
              : f,
          ),
        )
      }
    }

    setIsUploading(false)
  }

  const clearAll = () => {
    setFiles([])
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "text-green-600 bg-green-100"
      case "error":
        return "text-red-600 bg-red-100"
      case "uploading":
        return "text-blue-600 bg-blue-100"
      default:
        return "text-gray-600 bg-gray-100"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <Check className="h-4 w-4" />
      case "error":
        return <AlertTriangle className="h-4 w-4" />
      case "uploading":
        return <RefreshCw className="h-4 w-4 animate-spin" />
      default:
        return <Upload className="h-4 w-4" />
    }
  }

  return (
    <Card className={cn("card-shadow-lg", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          File Upload
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drop Zone */}
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 cursor-pointer",
            isDragOver
              ? "border-blue-500 bg-blue-50 scale-105"
              : "border-gray-300 hover:border-gray-400 hover:bg-gray-50",
            disabled && "opacity-50 cursor-not-allowed",
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Upload className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Drop files here or click to browse</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {multiple ? `Upload up to ${maxFiles} files` : "Upload a single file"} (max {maxSize}MB each)
              </p>
              {allowedTypes.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">Allowed types: {allowedTypes.join(", ")}</p>
              )}
            </div>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Selected Files ({files.length})</h4>
              <div className="flex gap-2">
                {files.some((f) => f.status === "pending") && (
                  <Button onClick={uploadFiles} disabled={isUploading} size="sm" className="btn-primary">
                    {isUploading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload All
                      </>
                    )}
                  </Button>
                )}
                <Button onClick={clearAll} variant="outline" size="sm" className="btn-secondary">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              </div>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {files.map((fileItem) => (
                <Card key={fileItem.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    {/* File Icon/Preview */}
                    <div className="flex-shrink-0">
                      {fileItem.preview ? (
                        <img
                          src={fileItem.preview || "/placeholder.svg"}
                          alt={fileItem.file.name}
                          className="w-12 h-12 object-cover rounded border"
                        />
                      ) : (
                        getFileIcon(fileItem.file)
                      )}
                    </div>

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <h5 className="font-medium truncate">{fileItem.file.name}</h5>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(fileItem.file.size)} • {fileItem.file.type || "Unknown type"}
                      </p>

                      {/* Progress Bar */}
                      {fileItem.status === "uploading" && <Progress value={fileItem.progress} className="mt-2 h-2" />}

                      {/* Error Message */}
                      {fileItem.error && (
                        <Alert className="mt-2">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription className="text-sm">{fileItem.error}</AlertDescription>
                        </Alert>
                      )}
                    </div>

                    {/* Status Badge */}
                    <Badge className={cn("flex items-center gap-1", getStatusColor(fileItem.status))}>
                      {getStatusIcon(fileItem.status)}
                      {fileItem.status}
                    </Badge>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      {fileItem.status === "success" && fileItem.url && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(fileItem.url, "_blank")}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const a = document.createElement("a")
                              a.href = fileItem.url!
                              a.download = fileItem.file.name
                              a.click()
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </>
                      )}

                      {fileItem.status === "error" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => retryUpload(fileItem.id)}
                          className="h-8 w-8 p-0"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(fileItem.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Upload Summary */}
        {files.length > 0 && (
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-4 text-sm">
              <span>
                Total: <strong>{files.length}</strong> files
              </span>
              <span>
                Size: <strong>{formatFileSize(files.reduce((acc, f) => acc + f.file.size, 0))}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              {files.filter((f) => f.status === "success").length > 0 && (
                <Badge className="bg-green-100 text-green-800">
                  {files.filter((f) => f.status === "success").length} uploaded
                </Badge>
              )}
              {files.filter((f) => f.status === "error").length > 0 && (
                <Badge className="bg-red-100 text-red-800">
                  {files.filter((f) => f.status === "error").length} failed
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
