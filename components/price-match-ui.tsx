"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import {
  Upload,
  FileSpreadsheet,
  Zap,
  Download,
  CheckCircle,
  AlertTriangle,
  Clock,
  BarChart3,
  Play,
  Pause,
  RefreshCw,
} from "lucide-react"
import type { Project, MatchedItem } from "@/lib/models"

interface PriceMatchUIProps {
  project?: Project
  existingQuotation?: any
  onComplete?: (results: MatchedItem[]) => void
  onCancel?: () => void
}

interface MatchingProgress {
  stage: "idle" | "uploading" | "parsing" | "matching" | "saving" | "complete" | "error"
  progress: number
  message: string
  details?: string
}

interface MatchingSettings {
  model: "v0" | "v1" | "v2"
  confidenceThreshold: number
  batchSize: number
  enableLogging: boolean
}

export function PriceMatchUI({ project, existingQuotation, onComplete, onCancel }: PriceMatchUIProps) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [matchingProgress, setMatchingProgress] = useState<MatchingProgress>({
    stage: "idle",
    progress: 0,
    message: "Ready to start",
  })
  const [results, setResults] = useState<MatchedItem[]>([])
  const [settings, setSettings] = useState<MatchingSettings>({
    model: "v0",
    confidenceThreshold: 70,
    batchSize: 10,
    enableLogging: true,
  })
  const [logs, setLogs] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [canPause, setCanPause] = useState(false)
  const [jobId, setJobId] = useState<string | null>(null)

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    const logEntry = `[${timestamp}] ${message}`
    setLogs((prev) => [...prev, logEntry])
    if (settings.enableLogging) {
      console.log(`🔍 ${logEntry}`)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.name.match(/\.(xlsx|xls|csv)$/i)) {
        setFile(selectedFile)
        addLog(`File selected: ${selectedFile.name} (${(selectedFile.size / 1024).toFixed(1)} KB)`)
        setMatchingProgress({
          stage: "idle",
          progress: 0,
          message: `Ready to process ${selectedFile.name}`,
        })
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please select an Excel (.xlsx, .xls) or CSV file",
          variant: "destructive",
        })
      }
    }
  }

  const startMatching = async () => {
    if (!file) {
      toast({
        title: "No File Selected",
        description: "Please select a file to process",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    setCanPause(true)
    setLogs([])
    addLog("🚀 Starting price matching process...")

    try {
      // Stage 1: Upload
      setMatchingProgress({
        stage: "uploading",
        progress: 10,
        message: "Uploading file...",
        details: `Processing ${file.name}`,
      })
      addLog(`📤 Uploading file: ${file.name}`)

      const formData = new FormData()
      formData.append("file", file)
      formData.append("model", settings.model)
      formData.append("confidenceThreshold", settings.confidenceThreshold.toString())
      formData.append("batchSize", settings.batchSize.toString())

      if (project) {
        formData.append("projectId", project.id)
        formData.append("projectName", project.name)
        formData.append("clientName", project.clientName)
      }

      // Stage 2: Start matching
      setMatchingProgress({
        stage: "parsing",
        progress: 25,
        message: "Parsing file and extracting items...",
        details: "Reading Excel/CSV data",
      })
      addLog("📊 Parsing file and extracting BOQ items...")

      const response = await fetch("/api/projects/match", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      setJobId(data.jobId)
      addLog(`✅ Job created with ID: ${data.jobId}`)

      // Stage 3: Poll for progress
      await pollMatchingProgress(data.jobId)
    } catch (error) {
      console.error("❌ Matching error:", error)
      addLog(`❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`)
      setMatchingProgress({
        stage: "error",
        progress: 0,
        message: "Matching failed",
        details: error instanceof Error ? error.message : "Unknown error",
      })
      toast({
        title: "Matching Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
      setCanPause(false)
    }
  }

  const pollMatchingProgress = async (jobId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/matching/jobs/${jobId}`)
        if (!response.ok) {
          throw new Error("Failed to fetch job status")
        }

        const jobData = await response.json()
        const job = jobData.job

        addLog(`📊 Job status: ${job.status} (${job.progress}%)`)

        if (job.status === "processing") {
          setMatchingProgress({
            stage: "matching",
            progress: Math.min(job.progress, 90),
            message: "AI matching in progress...",
            details: `Processing batch ${Math.ceil(job.progress / 10)} of ${Math.ceil(100 / 10)}`,
          })
        } else if (job.status === "completed") {
          clearInterval(pollInterval)

          setMatchingProgress({
            stage: "complete",
            progress: 100,
            message: "Matching completed successfully!",
            details: `Matched ${job.results?.length || 0} items`,
          })

          setResults(job.results || [])
          addLog(`🎉 Matching completed! ${job.results?.length || 0} items matched`)

          toast({
            title: "Matching Complete",
            description: `Successfully matched ${job.results?.length || 0} items`,
          })

          if (onComplete) {
            onComplete(job.results || [])
          }
        } else if (job.status === "failed") {
          clearInterval(pollInterval)
          throw new Error(job.error || "Job failed")
        }
      } catch (error) {
        clearInterval(pollInterval)
        throw error
      }
    }, 2000)
  }

  const pauseMatching = async () => {
    if (jobId) {
      try {
        await fetch(`/api/matching/jobs/${jobId}/pause`, { method: "POST" })
        setCanPause(false)
        addLog("⏸️ Matching paused")
        toast({ title: "Matching Paused", description: "You can resume anytime" })
      } catch (error) {
        console.error("Failed to pause:", error)
      }
    }
  }

  const downloadResults = async () => {
    if (jobId) {
      try {
        const response = await fetch(`/api/matching/jobs/${jobId}/download`)
        if (response.ok) {
          const blob = await response.blob()
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.href = url
          a.download = `price-match-results-${new Date().toISOString().split("T")[0]}.xlsx`
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)

          addLog("📥 Results downloaded successfully")
          toast({ title: "Download Complete", description: "Results saved to your device" })
        }
      } catch (error) {
        console.error("Download failed:", error)
        toast({ title: "Download Failed", description: "Could not download results", variant: "destructive" })
      }
    }
  }

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case "uploading":
        return <Upload className="h-4 w-4 animate-pulse" />
      case "parsing":
        return <FileSpreadsheet className="h-4 w-4 animate-pulse" />
      case "matching":
        return <Zap className="h-4 w-4 animate-pulse" />
      case "saving":
        return <Download className="h-4 w-4 animate-pulse" />
      case "complete":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            AI-Powered Price Matching
          </CardTitle>
          <CardDescription>Upload your BOQ file and let AI match items with your price database</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="upload">Upload</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="progress">Progress</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="file-upload">Select BOQ File</Label>
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileSelect}
                    ref={fileInputRef}
                    disabled={isProcessing}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Supported formats: Excel (.xlsx, .xls) and CSV files
                  </p>
                </div>

                {file && (
                  <Alert>
                    <FileSpreadsheet className="h-4 w-4" />
                    <AlertDescription>
                      <strong>{file.name}</strong> ({(file.size / 1024).toFixed(1)} KB) ready for processing
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2">
                  <Button onClick={startMatching} disabled={!file || isProcessing} className="flex-1">
                    {isProcessing ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Start Matching
                      </>
                    )}
                  </Button>

                  {canPause && (
                    <Button onClick={pauseMatching} variant="outline">
                      <Pause className="mr-2 h-4 w-4" />
                      Pause
                    </Button>
                  )}

                  {onCancel && (
                    <Button onClick={onCancel} variant="outline">
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="model">AI Model</Label>
                  <select
                    id="model"
                    value={settings.model}
                    onChange={(e) => setSettings((prev) => ({ ...prev, model: e.target.value as "v0" | "v1" | "v2" }))}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                    disabled={isProcessing}
                  >
                    <option value="v0">v0 - Cohere (Fast & Accurate)</option>
                    <option value="v1">v1 - OpenAI (High Quality)</option>
                    <option value="v2">v2 - Hybrid (Best Results)</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="confidence">Confidence Threshold: {settings.confidenceThreshold}%</Label>
                  <input
                    id="confidence"
                    type="range"
                    min="50"
                    max="95"
                    value={settings.confidenceThreshold}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev, confidenceThreshold: Number.parseInt(e.target.value) }))
                    }
                    className="w-full"
                    disabled={isProcessing}
                  />
                  <p className="text-sm text-muted-foreground">
                    Only matches above this confidence level will be included
                  </p>
                </div>

                <div>
                  <Label htmlFor="batch-size">Batch Size: {settings.batchSize}</Label>
                  <input
                    id="batch-size"
                    type="range"
                    min="5"
                    max="50"
                    value={settings.batchSize}
                    onChange={(e) => setSettings((prev) => ({ ...prev, batchSize: Number.parseInt(e.target.value) }))}
                    className="w-full"
                    disabled={isProcessing}
                  />
                  <p className="text-sm text-muted-foreground">Number of items to process in each batch</p>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    id="enable-logging"
                    type="checkbox"
                    checked={settings.enableLogging}
                    onChange={(e) => setSettings((prev) => ({ ...prev, enableLogging: e.target.checked }))}
                    disabled={isProcessing}
                  />
                  <Label htmlFor="enable-logging">Enable detailed logging</Label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="progress" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {getStageIcon(matchingProgress.stage)}
                    Processing Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>{matchingProgress.message}</span>
                      <span>{matchingProgress.progress}%</span>
                    </div>
                    <Progress value={matchingProgress.progress} className="h-2" />
                    {matchingProgress.details && (
                      <p className="text-sm text-muted-foreground mt-1">{matchingProgress.details}</p>
                    )}
                  </div>

                  {settings.enableLogging && logs.length > 0 && (
                    <div>
                      <Label>Processing Log</Label>
                      <div className="bg-muted p-3 rounded-md max-h-40 overflow-y-auto font-mono text-xs">
                        {logs.map((log, index) => (
                          <div key={index} className="mb-1">
                            {log}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="results" className="space-y-4">
              {results.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Matching Results ({results.length} items)</h3>
                    <div className="flex gap-2">
                      <Button onClick={downloadResults} variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Download Excel
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {results.filter((r) => r.confidence >= 80).length}
                        </div>
                        <p className="text-sm text-muted-foreground">High Confidence (≥80%)</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-yellow-600">
                          {results.filter((r) => r.confidence >= 60 && r.confidence < 80).length}
                        </div>
                        <p className="text-sm text-muted-foreground">Medium Confidence (60-79%)</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-red-600">
                          {results.filter((r) => r.confidence < 60).length}
                        </div>
                        <p className="text-sm text-muted-foreground">Low Confidence (&lt;60%)</p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {results.slice(0, 20).map((result, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{result.boqDescription}</h4>
                            <p className="text-xs text-muted-foreground">→ {result.matchedItemDescription}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant={result.confidence >= 80 ? "default" : "secondary"}>
                                {result.confidence}% confidence
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                Qty: {result.boqQty} × ${result.matchedRate} = $
                                {(result.boqQty * result.matchedRate).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                    {results.length > 20 && (
                      <p className="text-center text-sm text-muted-foreground">
                        ... and {results.length - 20} more items
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No results yet. Start matching to see results here.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
