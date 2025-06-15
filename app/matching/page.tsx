"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { FileSearch, Clock, CheckCircle, XCircle, AlertCircle, Zap, RefreshCw, Download } from "lucide-react"
import type { MatchingJob } from "@/lib/models"

export default function MatchingDashboard() {
  const { toast } = useToast()
  const [jobs, setJobs] = useState<MatchingJob[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchJobs()
  }, []) // Remove jobs dependency to prevent infinite loop

  const fetchJobs = async (silent = false) => {
    if (!silent) setLoading(true)
    setRefreshing(true)

    try {
      const response = await fetch("/api/matching/jobs")
      if (!response.ok) throw new Error("Failed to fetch jobs")

      const data = await response.json()
      setJobs(data.jobs || [])
    } catch (error) {
      if (!silent) {
        toast({
          title: "Error",
          description: "Failed to fetch matching jobs",
          variant: "destructive",
        })
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Separate useEffect for polling active jobs
  useEffect(() => {
    const interval = setInterval(() => {
      const hasActiveJobs = jobs.some((job) => job.status === "processing" || job.status === "pending")
      if (hasActiveJobs) {
        fetchJobs(true) // Silent refresh
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [jobs.length]) // Only depend on jobs length, not the entire jobs array

  const downloadResults = async (jobId: string) => {
    try {
      const response = await fetch(`/api/matching/jobs/${jobId}/download`)
      if (!response.ok) throw new Error("Failed to download results")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `matching-results-${jobId}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Success",
        description: "Results downloaded successfully",
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
      case "pending":
        return <AlertCircle className="h-5 w-5 text-yellow-600" />
      default:
        return <Clock className="h-5 w-5 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: "bg-green-100 text-green-800 hover:bg-green-100",
      processing: "bg-blue-100 text-blue-800 hover:bg-blue-100",
      failed: "bg-red-100 text-red-800 hover:bg-red-100",
      pending: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
    }
    return variants[status as keyof typeof variants] || variants.pending
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - new Date(date).getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return new Date(date).toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="container mx-auto py-4">
        <div className="text-center py-8">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          Loading matching jobs...
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-4 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSearch className="h-6 w-6 text-blue-600" />
              <div>
                <CardTitle>Matching Dashboard</CardTitle>
                <CardDescription>Monitor AI-powered price matching jobs and their progress.</CardDescription>
              </div>
            </div>
            <Button onClick={() => fetchJobs()} disabled={refreshing} variant="outline" size="sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileSearch className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No matching jobs found.</p>
              <p className="text-sm">Start a new price matching job from the Price Matcher page.</p>
              <Button className="mt-4" onClick={() => (window.location.href = "/price-matcher")}>
                Go to Price Matcher
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <Card key={job.id} className="border-l-4 border-l-blue-600">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(job.status)}
                        <div>
                          <h3 className="font-semibold">Project {job.projectId}</h3>
                          <p className="text-sm text-muted-foreground">
                            {formatTimeAgo(job.createdAt)} • {job.model.toUpperCase()} Model
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusBadge(job.status)}>{job.status}</Badge>
                        {job.model === "cohere" && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Zap className="h-3 w-3" />
                            embed-v4.0
                          </Badge>
                        )}
                        {job.status === "completed" && job.results && (
                          <Button onClick={() => downloadResults(job.id)} size="sm" variant="outline">
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        )}
                      </div>
                    </div>

                    {(job.status === "processing" || job.status === "pending") && (
                      <div className="mb-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progress</span>
                          <span>{job.progress}%</span>
                        </div>
                        <Progress value={job.progress} className="h-2" />
                      </div>
                    )}

                    {job.logs && job.logs.length > 0 && (
                      <div className="bg-slate-50 rounded-md p-3 font-mono text-sm">
                        <div className="max-h-20 overflow-y-auto">
                          {job.logs.slice(-3).map((log, index) => (
                            <p key={index} className="text-slate-700">
                              {log}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

                    {job.error && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-red-800 text-sm font-medium">Error: {job.error}</p>
                      </div>
                    )}

                    {job.results && job.results.length > 0 && (
                      <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{job.results.length} items matched</span>
                        <span>•</span>
                        <span>
                          Avg. confidence:{" "}
                          {Math.round(
                            (job.results.reduce((sum: number, item: any) => sum + (item.confidence || 0), 0) /
                              job.results.length) *
                              100,
                          )}
                          %
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
