"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, Play, Download, FileSpreadsheet, Clock, CheckCircle, XCircle, BarChart3, Trash2 } from "lucide-react"

interface BatchJob {
  id: string
  files: File[]
  model: string
  clientName: string
  projectName: string
  status: "pending" | "processing" | "completed" | "failed"
  progress: number
  results: any[]
  startTime: Date
  endTime?: Date
  error?: string
}

export function BatchProcessorUI() {
  const { toast } = useToast()
  const [files, setFiles] = useState<File[]>([])
  const [clientName, setClientName] = useState("")
  const [projectName, setProjectName] = useState("")
  const [selectedModel, setSelectedModel] = useState("v0")
  const [jobs, setJobs] = useState<BatchJob[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    // Load existing jobs
    loadJobs()
  }, [])

  const loadJobs = async () => {
    try {
      const response = await fetch("/api/batch/jobs")
      if (response.ok) {
        const data = await response.json()
        setJobs(data.jobs || [])
      }
    } catch (error) {
      console.error("Failed to load jobs:", error)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    const excelFiles = selectedFiles.filter((file) => file.name.match(/\.(xlsx|xls|csv)$/i))

    if (excelFiles.length !== selectedFiles.length) {
      toast({
        title: "Invalid Files",
        description: "Only Excel (.xlsx, .xls) and CSV files are supported.",
        variant: "destructive",
      })
    }

    setFiles(excelFiles)
  }

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index))
  }

  const startBatchProcessing = async () => {
    if (files.length === 0) {
      toast({
        title: "No Files Selected",
        description: "Please select at least one Excel file to process.",
        variant: "destructive",
      })
      return
    }

    if (!clientName.trim() || !projectName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide client name and project name.",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)

    try {
      const formData = new FormData()
      files.forEach((file) => formData.append("files", file))
      formData.append("model", selectedModel)
      formData.append("clientName", clientName)
      formData.append("projectName", projectName)

      const response = await fetch("/api/batch/process", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Failed to start batch processing")

      const data = await response.json()
      const jobId = data.jobId

      toast({
        title: "Batch Processing Started",
        description: `Processing ${files.length} files. Job ID: ${jobId}`,
      })

      // Start polling for progress
      pollJobProgress(jobId)

      // Clear form
      setFiles([])
      setClientName("")
      setProjectName("")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start batch processing",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const pollJobProgress = (jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/batch/jobs/${jobId}`)
        if (response.ok) {
          const data = await response.json()
          const job = data.job

          setJobs((prev) => {
            const updated = prev.filter((j) => j.id !== jobId)
            return [job, ...updated]
          })

          if (job.status === "completed" || job.status === "failed") {
            clearInterval(interval)
            if (job.status === "completed") {
              toast({
                title: "Batch Processing Complete",
                description: `Successfully processed ${job.results.length} files.`,
              })
            }
          }
        }
      } catch (error) {
        clearInterval(interval)
      }
    }, 2000)
  }

  const downloadResults = async (jobId: string) => {
    try {
      const response = await fetch(`/api/batch/jobs/${jobId}/download`)
      if (!response.ok) throw new Error("Download failed")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `batch-results-${jobId}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Success",
        description: "Batch results downloaded successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download results",
        variant: "destructive",
      })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "processing":
        return <Clock className="h-5 w-5 text-blue-600 animate-spin" />
      case "failed":
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return <Clock className="h-5 w-5 text-yellow-600" />
    }
  }

  const formatDuration = (startTime: Date, endTime?: Date) => {
    const end = endTime || new Date()
    const duration = end.getTime() - new Date(startTime).getTime()
    const minutes = Math.floor(duration / 60000)
    const seconds = Math.floor((duration % 60000) / 1000)
    return `${minutes}m ${seconds}s`
  }

  return (
    <div className="container mx-auto py-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-6 w-6 text-brand-DEFAULT" />
            Batch File Processing
          </CardTitle>
          <CardDescription>Process multiple Excel files simultaneously with AI-powered price matching.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">Upload & Process</TabsTrigger>
              <TabsTrigger value="jobs">Job History</TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="clientName">Client Name</Label>
                  <Input
                    id="clientName"
                    placeholder="e.g., Acme Corporation"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    disabled={isProcessing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="projectName">Project Name</Label>
                  <Input
                    id="projectName"
                    placeholder="e.g., Downtown Office Complex"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    disabled={isProcessing}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">AI Model</Label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                  disabled={isProcessing}
                >
                  <option value="v0">v0 - Cohere (Fast & Accurate)</option>
                  <option value="v1">v1 - OpenAI (High Quality)</option>
                  <option value="v2">v2 - Hybrid (Best Results)</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="files">Excel Files</Label>
                <Input
                  id="files"
                  type="file"
                  multiple
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileSelect}
                  disabled={isProcessing}
                />
                <p className="text-sm text-muted-foreground">
                  Select multiple Excel (.xlsx, .xls) or CSV files to process
                </p>
              </div>

              {files.length > 0 && (
                <div className="space-y-2">
                  <Label>Selected Files ({files.length})</Label>
                  <div className="border rounded-md p-4 max-h-40 overflow-y-auto">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="h-4 w-4 text-green-600" />
                          <span className="text-sm">{file.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {(file.size / 1024).toFixed(1)} KB
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          disabled={isProcessing}
                          className="h-6 w-6 p-0"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button
                onClick={startBatchProcessing}
                disabled={isProcessing || files.length === 0}
                className="w-full bg-brand-DEFAULT hover:bg-brand-dark text-brand-foreground"
              >
                <Play className="mr-2 h-4 w-4" />
                {isProcessing ? "Starting..." : `Process ${files.length} Files`}
              </Button>
            </TabsContent>

            <TabsContent value="jobs" className="space-y-4">
              {jobs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No batch jobs found.</p>
                  <p className="text-sm">Start processing files to see job history here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {jobs.map((job) => (
                    <Card key={job.id} className="border-l-4 border-l-brand-DEFAULT">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(job.status)}
                            <div>
                              <h3 className="font-semibold">{job.projectName}</h3>
                              <p className="text-sm text-muted-foreground">
                                {job.clientName} • {job.files.length} files • {job.model.toUpperCase()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                job.status === "completed"
                                  ? "default"
                                  : job.status === "failed"
                                    ? "destructive"
                                    : "secondary"
                              }
                            >
                              {job.status}
                            </Badge>
                            {job.status === "completed" && (
                              <Button onClick={() => downloadResults(job.id)} size="sm" variant="outline">
                                <Download className="h-4 w-4 mr-1" />
                                Download
                              </Button>
                            )}
                          </div>
                        </div>

                        {job.status === "processing" && (
                          <div className="mb-3">
                            <div className="flex justify-between text-sm mb-1">
                              <span>Progress</span>
                              <span>{job.progress}%</span>
                            </div>
                            <Progress value={job.progress} className="h-2" />
                          </div>
                        )}

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Started: {new Date(job.startTime).toLocaleString()}</span>
                          <span>Duration: {formatDuration(job.startTime, job.endTime)}</span>
                          {job.status === "completed" && (
                            <span>
                              Avg. Confidence:{" "}
                              {(
                                job.results.reduce((sum, r) => sum + r.averageConfidence, 0) / job.results.length
                              ).toFixed(1)}
                              %
                            </span>
                          )}
                        </div>

                        {job.error && (
                          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-red-800 text-sm font-medium">Error: {job.error}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
