"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BarChart3, TrendingUp, Clock, Target, Award, Activity, Zap, Brain, GitMerge } from "lucide-react"

interface ModelPerformance {
  model: "v0" | "v1" | "v2"
  totalJobs: number
  totalItems: number
  averageConfidence: number
  averageProcessingTime: number
  successRate: number
  lastUsed: Date
  confidenceDistribution: {
    high: number
    medium: number
    low: number
  }
}

interface AnalyticsData {
  modelPerformances: ModelPerformance[]
  modelComparison: {
    totalComparisons: number
    cohereVsOpenaiAgreement: number
    cohereVsHybridAgreement: number
    openaiVsHybridAgreement: number
    bestPerformingModel: string
  }
  recommendation: {
    recommendedModel: "v0" | "v1" | "v2"
    reason: string
    confidence: number
  }
}

export function PerformanceDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      const response = await fetch("/api/analytics/performance")
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      }
    } catch (error) {
      console.error("Failed to load analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  const getModelIcon = (model: string) => {
    switch (model) {
      case "v0":
        return <Zap className="h-5 w-5 text-blue-600" />
      case "v1":
        return <Brain className="h-5 w-5 text-green-600" />
      case "v2":
        return <GitMerge className="h-5 w-5 text-purple-600" />
      default:
        return <Activity className="h-5 w-5" />
    }
  }

  const getModelName = (model: string) => {
    switch (model) {
      case "v0":
        return "Cohere"
      case "v1":
        return "OpenAI"
      case "v2":
        return "Hybrid"
      default:
        return "Unknown"
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-green-600"
    if (confidence >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  if (loading) {
    return (
      <div className="container mx-auto py-4">
        <div className="text-center py-8">Loading analytics...</div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="container mx-auto py-4">
        <Card>
          <CardContent className="text-center py-8">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No analytics data available.</p>
            <p className="text-sm text-muted-foreground">Start processing files to generate performance analytics.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-brand-DEFAULT" />
            Performance Analytics
          </CardTitle>
          <CardDescription>Comprehensive analysis of AI model performance and accuracy metrics.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="models">Model Comparison</TabsTrigger>
              <TabsTrigger value="accuracy">Accuracy Analysis</TabsTrigger>
              <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium">Total Jobs</p>
                        <p className="text-2xl font-bold">
                          {analytics.modelPerformances.reduce((sum, m) => sum + m.totalJobs, 0)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium">Items Processed</p>
                        <p className="text-2xl font-bold">
                          {analytics.modelPerformances.reduce((sum, m) => sum + m.totalItems, 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-purple-600" />
                      <div>
                        <p className="text-sm font-medium">Avg. Confidence</p>
                        <p className="text-2xl font-bold">
                          {(
                            analytics.modelPerformances.reduce((sum, m) => sum + m.averageConfidence, 0) /
                            analytics.modelPerformances.length
                          ).toFixed(1)}
                          %
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-orange-600" />
                      <div>
                        <p className="text-sm font-medium">Avg. Speed</p>
                        <p className="text-2xl font-bold">
                          {(
                            analytics.modelPerformances.reduce((sum, m) => sum + m.averageProcessingTime, 0) /
                            analytics.modelPerformances.length /
                            1000
                          ).toFixed(1)}
                          s
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Model Performance Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Model Performance Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Model</TableHead>
                        <TableHead>Jobs</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Avg. Confidence</TableHead>
                        <TableHead>Success Rate</TableHead>
                        <TableHead>Avg. Speed</TableHead>
                        <TableHead>Last Used</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analytics.modelPerformances.map((model) => (
                        <TableRow key={model.model}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getModelIcon(model.model)}
                              <span className="font-medium">{getModelName(model.model)}</span>
                              <Badge variant="outline">{model.model}</Badge>
                            </div>
                          </TableCell>
                          <TableCell>{model.totalJobs.toLocaleString()}</TableCell>
                          <TableCell>{model.totalItems.toLocaleString()}</TableCell>
                          <TableCell>
                            <span className={getConfidenceColor(model.averageConfidence)}>
                              {model.averageConfidence.toFixed(1)}%
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={model.successRate * 100} className="w-16 h-2" />
                              <span className="text-sm">{(model.successRate * 100).toFixed(1)}%</span>
                            </div>
                          </TableCell>
                          <TableCell>{(model.averageProcessingTime / 1000).toFixed(1)}s</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(model.lastUsed).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="models" className="space-y-6">
              {/* Model Agreement Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle>Model Agreement Analysis</CardTitle>
                  <CardDescription>How often different AI models agree on the same matches</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">
                        {analytics.modelComparison.cohereVsOpenaiAgreement.toFixed(1)}%
                      </div>
                      <p className="text-sm text-muted-foreground">Cohere vs OpenAI Agreement</p>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">
                        {analytics.modelComparison.cohereVsHybridAgreement.toFixed(1)}%
                      </div>
                      <p className="text-sm text-muted-foreground">Cohere vs Hybrid Agreement</p>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600">
                        {analytics.modelComparison.openaiVsHybridAgreement.toFixed(1)}%
                      </div>
                      <p className="text-sm text-muted-foreground">OpenAI vs Hybrid Agreement</p>
                    </div>
                  </div>
                  <div className="mt-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      Based on {analytics.modelComparison.totalComparisons.toLocaleString()} comparisons
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Best Performing Model */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-yellow-600" />
                    Best Performing Model
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    {getModelIcon(analytics.modelComparison.bestPerformingModel)}
                    <div>
                      <h3 className="text-xl font-bold">
                        {getModelName(analytics.modelComparison.bestPerformingModel)}
                      </h3>
                      <p className="text-muted-foreground">
                        Currently showing the highest overall performance across all metrics
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="accuracy" className="space-y-6">
              {/* Confidence Distribution */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {analytics.modelPerformances.map((model) => (
                  <Card key={model.model}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        {getModelIcon(model.model)}
                        {getModelName(model.model)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">High Confidence (≥80%)</span>
                          <span className="text-sm font-medium text-green-600">
                            {model.confidenceDistribution.high.toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={model.confidenceDistribution.high} className="h-2" />

                        <div className="flex justify-between items-center">
                          <span className="text-sm">Medium Confidence (60-80%)</span>
                          <span className="text-sm font-medium text-yellow-600">
                            {model.confidenceDistribution.medium.toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={model.confidenceDistribution.medium} className="h-2" />

                        <div className="flex justify-between items-center">
                          <span className="text-sm">Low Confidence (&lt;60%)</span>
                          <span className="text-sm font-medium text-red-600">
                            {model.confidenceDistribution.low.toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={model.confidenceDistribution.low} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-brand-DEFAULT" />
                    AI Model Recommendation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">{getModelIcon(analytics.recommendation.recommendedModel)}</div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2">
                        {getModelName(analytics.recommendation.recommendedModel)} (
                        {analytics.recommendation.recommendedModel})
                      </h3>
                      <p className="text-muted-foreground mb-4">{analytics.recommendation.reason}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Confidence:</span>
                        <Progress value={analytics.recommendation.confidence} className="w-32 h-2" />
                        <span className="text-sm">{analytics.recommendation.confidence}%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Usage Guidelines */}
              <Card>
                <CardHeader>
                  <CardTitle>Usage Guidelines</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="h-5 w-5 text-blue-600" />
                        <h4 className="font-medium">Cohere (v0)</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Best for: Fast processing, construction terminology, large batches
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Brain className="h-5 w-5 text-green-600" />
                        <h4 className="font-medium">OpenAI (v1)</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Best for: Complex descriptions, technical specifications, high accuracy needs
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <GitMerge className="h-5 w-5 text-purple-600" />
                        <h4 className="font-medium">Hybrid (v2)</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Best for: Critical projects, maximum accuracy, consensus validation
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
